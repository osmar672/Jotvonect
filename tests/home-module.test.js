import assert from "node:assert/strict";
import test from "node:test";

import { initHomeMotion } from "../src/js/animations/home-motion.js";
import { buildHomeMarkup, moduleMeta, mount, unmount } from "../src/js/modules/home/index.js";

function createFakeContainer() {
  const handlers = new Map();

  return {
    innerHTML: "",
    classList: { add() {}, remove() {} },
    addEventListener(type, handler) {
      handlers.set(type, handler);
    },
    removeEventListener(type, handler) {
      if (handlers.get(type) === handler) handlers.delete(type);
    },
    contains: () => true,
    replaceChildren() {
      this.innerHTML = "";
    },
    clickTarget(moduleId) {
      const button = { dataset: { homeTarget: moduleId } };
      const target = { closest: selector => selector === "[data-home-target]" ? button : null };
      handlers.get("click")?.({ target });
    },
    hasHandler(type) {
      return handlers.has(type);
    }
  };
}

test("Inicio presenta la empresa, los estándares y el proceso de solución", () => {
  const markup = buildHomeMarkup();

  assert.deepEqual(moduleMeta, {
    id: "home",
    label: "Inicio",
    shortLabel: "IN",
    description: "Conoce JobConnect, sus estándares y la propuesta de valor."
  });
  assert.match(markup, /Somos una empresa digital orientada a la gestión de empleabilidad/);
  assert.match(markup, /Eficiencia/);
  assert.match(markup, /Modularidad/);
  assert.match(markup, /Buenas prácticas/);
  assert.match(markup, /Código claro/);
  assert.match(markup, /Accesibilidad/);
  assert.match(markup, /Resolución de problemas/);
  assert.match(markup, /data-cursor-aura/);
  assert.match(markup, /data-portal/);
  assert.match(markup, /data-final-orbit/);
  assert.match(markup, /Preparando movimiento/);
  assert.match(markup, /data-standards-explorer/);
  assert.match(markup, /role="tablist"/);
  assert.match(markup, /data-standard-detail/);
  assert.match(markup, /data-standard-progress/);
  assert.match(markup, /data-process-story/);
  assert.equal((markup.match(/data-process-step/g) ?? []).length, 4);
  assert.equal((markup.match(/data-standard-index=/g) ?? []).length, 6);
  assert.doesNotMatch(markup, /home-metrics|home-marquee|módulos conectados|operaciones HTTP|núcleo reutilizable/i);
  assert.equal((markup.match(/data-particle(?=\s|>)/g) ?? []).length, 34);

  const classes = new Set();
  const motionLabel = { textContent: "" };
  const previousMatchMedia = globalThis.matchMedia;
  globalThis.matchMedia = () => ({ matches: true });

  const removeMotion = initHomeMotion({
    classList: {
      add: className => classes.add(className),
      remove: className => classes.delete(className)
    },
    querySelector: selector => selector === "[data-motion-label]" ? motionLabel : null
  });

  assert.equal(classes.has("motion-reduced"), true);
  assert.equal(motionLabel.textContent, "Movimiento reducido activo");
  removeMotion();
  assert.equal(classes.has("motion-reduced"), false);
  globalThis.matchMedia = previousMatchMedia;
});

test("Inicio conecta sus botones con los módulos y libera animaciones al desmontarse", async () => {
  const container = createFakeContainer();
  const destinations = [];
  let motionInitialized = false;
  let motionDestroyed = false;

  await mount(container, {
    navigate: moduleId => destinations.push(moduleId),
    motion: {
      initHomeMotion(root) {
        motionInitialized = root === container;
        return () => { motionDestroyed = true; };
      }
    }
  });

  assert.equal(motionInitialized, true);
  assert.equal(container.hasHandler("click"), true);

  container.clickTarget("candidates");
  container.clickTarget("vacancies");
  await Promise.resolve();
  assert.deepEqual(destinations, ["candidates", "vacancies"]);

  unmount();
  assert.equal(motionDestroyed, true);
  assert.equal(container.hasHandler("click"), false);
  assert.equal(container.innerHTML, "");
});
