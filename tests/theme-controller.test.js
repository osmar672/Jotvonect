import assert from "node:assert/strict";
import test from "node:test";

import { THEME_STORAGE_KEY, createThemeController } from "../src/js/ui/theme-controller.js";

test("el tema oscuro se conserva y puede alternarse desde el encabezado", () => {
  const attributes = new Map();
  const listeners = new Map();
  const values = new Map([[THEME_STORAGE_KEY, "dark"]]);
  const root = {
    style: {},
    setAttribute(name, value) { attributes.set(name, value); }
  };
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  const button = {
    dataset: {},
    attributes: new Map(),
    setAttribute(name, value) { this.attributes.set(name, value); },
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    }
  };

  const controller = createThemeController({ root, storage });
  const unbind = controller.bind(button);

  assert.equal(controller.get(), "dark");
  assert.equal(attributes.get("data-theme"), "dark");
  assert.equal(button.dataset.currentTheme, "dark");
  assert.equal(button.attributes.get("aria-label"), "Activar modo claro");

  listeners.get("click")();
  assert.equal(controller.get(), "light");
  assert.equal(values.get(THEME_STORAGE_KEY), "light");
  assert.equal(button.dataset.currentTheme, "light");

  unbind();
  assert.equal(listeners.has("click"), false);
});
