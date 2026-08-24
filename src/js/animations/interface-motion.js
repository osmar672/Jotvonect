import { gsap } from "../../../node_modules/gsap/index.js";

function prefersReducedMotion() {
  return globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

function hasPrecisePointer() {
  return globalThis.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches ?? false;
}

function asElements(collection) {
  return collection ? [...collection].filter(Boolean) : [];
}

export function createInterfaceMotion(root = globalThis.document?.querySelector?.("#app") ?? null) {
  const reducedMotion = prefersReducedMotion();
  const activeTweens = new Set();
  const cleanupCallbacks = [];

  function remember(tween) {
    if (!tween) return tween;
    activeTweens.add(tween);
    tween.eventCallback?.("onComplete", () => activeTweens.delete(tween));
    return tween;
  }

  function transitionOut(container) {
    const targets = asElements(container?.children);
    if (reducedMotion || !targets.length) return Promise.resolve();

    return new Promise(resolve => {
      const tween = gsap.to(targets, {
        opacity: 0,
        y: -18,
        filter: "blur(7px)",
        stagger: 0.025,
        duration: 0.22,
        ease: "power2.in",
        overwrite: "auto",
        onComplete: () => {
          activeTweens.delete(tween);
          resolve();
        }
      });
      activeTweens.add(tween);
    });
  }

  function transitionIn(container) {
    const targets = asElements(container?.children);
    if (reducedMotion || !targets.length) return Promise.resolve();

    return new Promise(resolve => {
      const tween = gsap.fromTo(targets, {
        opacity: 0,
        y: 30,
        filter: "blur(10px)",
        clipPath: "inset(0 0 10% 0 round 24px)"
      }, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        clipPath: "inset(0 0 0% 0 round 0px)",
        stagger: 0.04,
        duration: 0.58,
        ease: "power4.out",
        clearProps: "filter,clipPath,transform,opacity",
        onComplete: () => {
          activeTweens.delete(tween);
          resolve();
        }
      });
      activeTweens.add(tween);
    });
  }

  function revealPanel(panel) {
    if (reducedMotion || !panel) return;
    const targets = panel.querySelectorAll(".navigation-panel__intro > *, .nav-item, .profile-summary, .profile-preview, .profile-form-section");
    if (!targets.length) return;

    remember(gsap.fromTo(targets, {
      opacity: 0,
      x: panel.classList.contains("app-drawer--left") ? -26 : 26,
      y: 10
    }, {
      opacity: 1,
      x: 0,
      y: 0,
      stagger: 0.035,
      duration: 0.46,
      ease: "power3.out",
      clearProps: "transform,opacity"
    }));
  }

  function revealCards(list) {
    if (reducedMotion || !list) return;
    const cards = list.querySelectorAll(".entity-card");
    if (!cards.length) return;

    gsap.killTweensOf(cards);
    remember(gsap.fromTo(cards, {
      opacity: 0,
      y: 20,
      scale: 0.985
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      stagger: 0.035,
      duration: 0.42,
      ease: "power3.out",
      clearProps: "transform,opacity"
    }));
  }

  function highlight(element) {
    if (reducedMotion || !element) return;
    remember(gsap.fromTo(element, {
      boxShadow: "0 0 0 0 rgba(109, 40, 217, 0.36)",
      scale: 0.985
    }, {
      boxShadow: "0 0 0 18px rgba(109, 40, 217, 0)",
      scale: 1,
      duration: 0.72,
      ease: "power3.out",
      clearProps: "boxShadow,transform"
    }));
  }

  function removeCard(element) {
    if (reducedMotion || !element) return Promise.resolve();

    return new Promise(resolve => {
      const tween = gsap.to(element, {
        opacity: 0,
        x: 30,
        height: 0,
        margin: 0,
        paddingTop: 0,
        paddingBottom: 0,
        duration: 0.34,
        ease: "power2.inOut",
        onComplete: () => {
          activeTweens.delete(tween);
          resolve();
        }
      });
      activeTweens.add(tween);
    });
  }

  function animateCounter(element, value) {
    if (!element) return;
    const nextValue = Number(value) || 0;
    if (reducedMotion) {
      element.textContent = String(nextValue);
      return;
    }

    const state = { value: Number(element.textContent) || 0 };
    remember(gsap.to(state, {
      value: nextValue,
      duration: 0.55,
      ease: "power2.out",
      onUpdate: () => {
        element.textContent = String(Math.round(state.value));
      }
    }));
  }

  function animateAccountFields(element) {
    if (reducedMotion || !element) return;
    const targets = element.querySelectorAll(".profile-form-section, label, fieldset");
    remember(gsap.fromTo(targets, {
      opacity: 0,
      y: 14
    }, {
      opacity: 1,
      y: 0,
      stagger: 0.025,
      duration: 0.36,
      ease: "power3.out",
      clearProps: "transform,opacity"
    }));
  }

  function addRipple(event) {
    const target = event.target?.closest?.(".btn, .menu-launch, .profile-trigger, .theme-toggle, .nav-item, .view-option, .standard-option");
    if (!target || !root?.contains?.(target) || target.disabled || reducedMotion) return;
    if (typeof globalThis.document?.createElement !== "function") return;

    const bounds = target.getBoundingClientRect();
    const diameter = Math.max(bounds.width, bounds.height) * 1.45;
    const ripple = globalThis.document.createElement("span");
    ripple.className = "interaction-ripple";
    ripple.style.width = `${diameter}px`;
    ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - bounds.left - diameter / 2}px`;
    ripple.style.top = `${event.clientY - bounds.top - diameter / 2}px`;
    target.append(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  }

  if (root?.addEventListener) {
    root.addEventListener("pointerdown", addRipple);
    cleanupCallbacks.push(() => root.removeEventListener("pointerdown", addRipple));
  }

  if (root?.addEventListener && hasPrecisePointer() && !reducedMotion) {
    let activeAura = null;
    let moveAuraX = null;
    let moveAuraY = null;
    const handlePointer = event => {
      const aura = root.querySelector?.("[data-shell-aura]");
      if (!aura) return;
      if (aura !== activeAura) {
        activeAura = aura;
        moveAuraX = gsap.quickTo(aura, "x", { duration: 0.8, ease: "power3.out" });
        moveAuraY = gsap.quickTo(aura, "y", { duration: 0.8, ease: "power3.out" });
      }
      moveAuraX?.(event.clientX);
      moveAuraY?.(event.clientY);
      aura.classList.add("is-visible");
    };
    const hideAura = () => root.querySelector?.("[data-shell-aura]")?.classList.remove("is-visible");
    root.addEventListener("pointermove", handlePointer);
    root.addEventListener("pointerleave", hideAura);
    cleanupCallbacks.push(() => root.removeEventListener("pointermove", handlePointer));
    cleanupCallbacks.push(() => root.removeEventListener("pointerleave", hideAura));
  }

  function destroy() {
    cleanupCallbacks.forEach(cleanup => cleanup());
    activeTweens.forEach(tween => tween.kill?.());
    activeTweens.clear();
  }

  return Object.freeze({
    reducedMotion,
    transitionOut,
    transitionIn,
    revealPanel,
    revealCards,
    highlight,
    removeCard,
    animateCounter,
    animateAccountFields,
    destroy
  });
}
