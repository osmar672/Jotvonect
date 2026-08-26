import { gsap } from "../../../node_modules/gsap/index.js";
import { ScrollTrigger } from "../../../node_modules/gsap/ScrollTrigger.js";
import Lenis from "../../../node_modules/lenis/dist/lenis.mjs";
import { animate, stagger } from "../../../node_modules/animejs/dist/modules/index.js";
import { initBlurText } from "./blur-text.js?v=lumen-1";

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion() {
  return globalThis.document?.documentElement?.classList?.contains("low-performance") || (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false);
}

function supportsPrecisePointer() {
  return globalThis.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches ?? false;
}

function setMotionLabel(root, label) {
  const motionLabel = root?.querySelector?.("[data-motion-label]");
  if (motionLabel) motionLabel.textContent = label;
}

function addPointerEffects(root, hero) {
  if (!hero || !supportsPrecisePointer()) return () => {};

  const title = hero.querySelector("[data-hero-title]");
  const particles = hero.querySelector("[data-particle-field]");
  const aura = hero.querySelector("[data-cursor-aura]");
  const interactiveElements = [...root.querySelectorAll(".home-button")];
  const cleanup = [];

  if (title && particles) {
    gsap.set(title, { transformPerspective: 1200, transformOrigin: "center center" });
    const rotateTitleX = gsap.quickTo(title, "rotationX", { duration: 0.65, ease: "power3.out" });
    const rotateTitleY = gsap.quickTo(title, "rotationY", { duration: 0.65, ease: "power3.out" });
    const moveParticlesX = gsap.quickTo(particles, "x", { duration: 0.8, ease: "power3.out" });
    const moveParticlesY = gsap.quickTo(particles, "y", { duration: 0.8, ease: "power3.out" });

    const handleHeroPointer = event => {
      const bounds = hero.getBoundingClientRect();
      const localX = event.clientX - bounds.left;
      const localY = event.clientY - bounds.top;
      const normalizedX = localX / bounds.width - 0.5;
      const normalizedY = localY / bounds.height - 0.5;

      rotateTitleX(normalizedY * -5);
      rotateTitleY(normalizedX * 7);
      moveParticlesX(normalizedX * 42);
      moveParticlesY(normalizedY * 28);
      if (aura) gsap.to(aura, { x: localX, y: localY, opacity: 1, duration: 0.34, ease: "power3.out", overwrite: "auto" });
    };

    const resetHeroPointer = () => {
      rotateTitleX(0);
      rotateTitleY(0);
      moveParticlesX(0);
      moveParticlesY(0);
      if (aura) gsap.to(aura, { opacity: 0, duration: 0.3, overwrite: "auto" });
    };

    hero.addEventListener("pointermove", handleHeroPointer);
    hero.addEventListener("pointerleave", resetHeroPointer);
    cleanup.push(() => hero.removeEventListener("pointermove", handleHeroPointer));
    cleanup.push(() => hero.removeEventListener("pointerleave", resetHeroPointer));
  }

  for (const element of interactiveElements) {
    const handlePointer = event => {
      const bounds = element.getBoundingClientRect();
      const x = event.clientX - bounds.left - bounds.width / 2;
      const y = event.clientY - bounds.top - bounds.height / 2;

      gsap.to(element, {
        x: x * 0.12,
        y: y * 0.16,
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        transformPerspective: 900,
        duration: 0.32,
        ease: "power2.out",
        overwrite: "auto"
      });
    };

    const resetPointer = () => {
      gsap.to(element, {
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        duration: 0.55,
        ease: "elastic.out(1, 0.45)",
        overwrite: "auto"
      });
    };

    element.addEventListener("pointermove", handlePointer);
    element.addEventListener("pointerleave", resetPointer);
    cleanup.push(() => element.removeEventListener("pointermove", handlePointer));
    cleanup.push(() => element.removeEventListener("pointerleave", resetPointer));
  }

  return () => {
    cleanup.forEach(removeListener => removeListener());
    gsap.killTweensOf([aura, title, particles, ...interactiveElements].filter(Boolean));
  };
}

export function initHomeMotion(root) {
  if (!root) return () => {};

  if (prefersReducedMotion()) {
    root.classList.add("motion-reduced");
    setMotionLabel(root, "Movimiento reducido activo");
    return () => root.classList.remove("motion-reduced");
  }

  root.classList.add("motion-active");
  setMotionLabel(root, "Movimiento interactivo activo");

  const removeBlurText = initBlurText(root, {
    delay: 200,
    animateBy: "words",
    direction: "top",
    onAnimationComplete: () => {
      root.dispatchEvent(new globalThis.CustomEvent("jobconnect:blur-text-complete"));
    }
  });

  const hero = root.querySelector(".home-hero");
  const particleField = root.querySelector("[data-particle-field]");
  const portal = root.querySelector("[data-portal]");
  const finalOrbit = root.querySelector("[data-final-orbit]");
  const processStory = root.querySelector("[data-process-story]");
  const processSteps = [...root.querySelectorAll("[data-process-step]")];
  const revealTargets = [...root.querySelectorAll("[data-reveal-section]")];
  const observedTweens = [];

  const gsapContext = gsap.context(() => {
    const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
    intro
      .from("[data-hero-kicker], .home-status", { opacity: 0, y: 20, duration: 0.55 })
      .from("[data-particle-field]", { opacity: 0, scale: 0.74, y: 80, duration: 1.1 }, "-=0.18")
      .from("[data-hero-footer]", { opacity: 0, y: 34, duration: 0.7 }, "-=0.6")
      .from(".home-scroll-cue", { opacity: 0, x: -18, duration: 0.45 }, "-=0.3");

    if (portal) {
      gsap.to(portal, { rotation: 360, duration: 34, repeat: -1, ease: "none" });
      gsap.fromTo(portal,
        { scale: 0.48, opacity: 0.15 },
        {
          scale: 1.18,
          opacity: 0.9,
          ease: "none",
          scrollTrigger: {
            trigger: ".home-story",
            start: "top 85%",
            end: "bottom 15%",
            scrub: 0.8
          }
        }
      );
    }

    if (particleField) {
      gsap.to(particleField, {
        yPercent: 38,
        scale: 1.24,
        opacity: 0.42,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.65 }
      });
    }

    gsap.to(".home-standards__heading h2", {
      xPercent: -7,
      ease: "none",
      scrollTrigger: {
        trigger: ".home-standards",
        start: "top bottom",
        end: "bottom top",
        scrub: 1
      }
    });

    if (finalOrbit) {
      gsap.fromTo(finalOrbit,
        { scale: 0.4, rotation: -70, opacity: 0.2 },
        {
          scale: 1.25,
          rotation: 40,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".home-final",
            start: "top bottom",
            end: "center center",
            scrub: 0.9
          }
        }
      );
    }

    if (processStory && processSteps.length) {
      for (const [index, step] of processSteps.entries()) {
        ScrollTrigger.create({
          trigger: step,
          start: "top 58%",
          end: "bottom 42%",
          onEnter: () => processStory.dispatchEvent(new globalThis.CustomEvent("jobconnect:process-change", { detail: { index } })),
          onEnterBack: () => processStory.dispatchEvent(new globalThis.CustomEvent("jobconnect:process-change", { detail: { index } }))
        });
      }

      gsap.to(".process-stage__visual", {
        rotation: 150,
        ease: "none",
        scrollTrigger: {
          trigger: processStory,
          start: "top 70%",
          end: "bottom 30%",
          scrub: 0.8
        }
      });
    }
  }, root);

  const revealObserver = typeof IntersectionObserver === "function"
    ? new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const label = entry.target.querySelector(".home-section-label");
        const heading = entry.target.querySelector("h2");
        const items = entry.target.querySelectorAll("[data-reveal-item]");

        if (label) {
          observedTweens.push(gsap.from(label, { opacity: 0, x: -34, duration: 0.65, ease: "power3.out" }));
        }
        if (heading) {
          observedTweens.push(gsap.from(heading, {
            opacity: 0,
            y: 72,
            clipPath: "inset(0 0 100% 0)",
            duration: 1,
            ease: "power4.out"
          }));
        }
        if (items.length) {
          observedTweens.push(gsap.from(items, {
            opacity: 0,
            y: 28,
            rotationY: 0,
            stagger: 0.055,
            duration: 0.6,
            ease: "power3.out"
          }));
        }

        revealObserver.unobserve(entry.target);
      }
    }, { threshold: 0.14 })
    : null;

  revealTargets.forEach(target => revealObserver?.observe(target));

  const particles = root.querySelectorAll("[data-particle]");
  const particleMotion = particles.length ? animate(particles, {
    x: (_element, index) => index % 2 === 0 ? 54 + (index % 5) * 11 : -48 - (index % 4) * 10,
    y: (_element, index) => index % 3 === 0 ? -68 - (index % 4) * 12 : 42 + (index % 6) * 9,
    rotate: (_element, index) => (index % 2 === 0 ? 1 : -1) * (120 + index * 9),
    scale: (_element, index) => 0.68 + (index % 5) * 0.16,
    duration: (_element, index) => 2600 + (index % 8) * 390,
    delay: stagger(34, { from: "center" }),
    ease: "inOutSine",
    alternate: true,
    loop: true
  }) : null;

  const removePointerEffects = addPointerEffects(root, hero);
  let lenis = null;
  let animationFrame = 0;
  let refreshFrame = 0;

  try {
    lenis = new Lenis({
      duration: 1.16,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.88
    });
    lenis.on("scroll", ScrollTrigger.update);

    const updateSmoothScroll = time => {
      lenis?.raf(time);
      animationFrame = requestAnimationFrame(updateSmoothScroll);
    };

    animationFrame = requestAnimationFrame(updateSmoothScroll);
  } catch {
    lenis = null;
  }

  refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());

  return () => {
    revealObserver?.disconnect();
    particleMotion?.cancel();
    observedTweens.forEach(tween => tween.kill());
    removePointerEffects();
    removeBlurText();
    gsapContext.revert();
    lenis?.destroy();
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (refreshFrame) cancelAnimationFrame(refreshFrame);
    root.classList.remove("motion-active");
  };
}
