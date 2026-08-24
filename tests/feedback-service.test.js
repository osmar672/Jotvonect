import assert from "node:assert/strict";
import test from "node:test";

import { createFeedbackService } from "../src/js/core/feedback-service.js";

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(value) {
    this.values.add(value);
  }

  remove(value) {
    this.values.delete(value);
  }

  contains(value) {
    return this.values.has(value);
  }
}

class FakeEventTarget {
  constructor(ownerDocument = null) {
    this.ownerDocument = ownerDocument;
    this.listeners = new Map();
    this.focusCount = 0;
    this.textContent = "";
  }

  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) ?? [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }

  removeEventListener(type, handler) {
    const handlers = this.listeners.get(type) ?? [];
    this.listeners.set(type, handlers.filter(candidate => candidate !== handler));
  }

  dispatch(type, event = {}) {
    const dispatchedEvent = {
      target: this,
      currentTarget: this,
      key: "",
      shiftKey: false,
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      ...event
    };

    for (const handler of [...(this.listeners.get(type) ?? [])]) handler(dispatchedEvent);
    return dispatchedEvent;
  }

  focus() {
    this.focusCount += 1;
    if (this.ownerDocument) this.ownerDocument.activeElement = this;
  }
}

class FakePageRoot {
  constructor() {
    this.attributes = new Set();
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  setAttribute(name) {
    this.attributes.add(name);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }
}

class FakeDocument extends FakeEventTarget {
  constructor() {
    super();
    this.ownerDocument = this;
    this.body = { classList: new FakeClassList() };
    this.pageRoot = new FakePageRoot();
    this.activeElement = null;
  }

  querySelector(selector) {
    return selector === "#app" ? this.pageRoot : null;
  }
}

class FakeDialogRoot {
  constructor(ownerDocument) {
    this.ownerDocument = ownerDocument;
    this.nodes = new Map();
    this._innerHTML = "";
  }

  set innerHTML(value) {
    this._innerHTML = value;
    this.nodes = new Map([
      ["[data-confirm-backdrop]", new FakeEventTarget(this.ownerDocument)],
      ["[data-confirm-message]", new FakeEventTarget(this.ownerDocument)],
      ["[data-confirm-cancel]", new FakeEventTarget(this.ownerDocument)],
      ["[data-confirm-accept]", new FakeEventTarget(this.ownerDocument)]
    ]);
  }

  get innerHTML() {
    return this._innerHTML;
  }

  querySelector(selector) {
    return this.nodes.get(selector) ?? null;
  }

  replaceChildren() {
    this._innerHTML = "";
    this.nodes.clear();
  }
}

function createDialogFixture() {
  const document = new FakeDocument();
  const previousFocus = new FakeEventTarget(document);
  const dialogRoot = new FakeDialogRoot(document);
  document.activeElement = previousFocus;

  return {
    document,
    previousFocus,
    dialogRoot,
    service: createFeedbackService(null, dialogRoot)
  };
}

test("la eliminación usa un modal propio, enfoca Cancelar y confirma desde su botón", async () => {
  const fixture = createDialogFixture();
  const message = "¿Eliminar “Vacante Frontend”?";
  const result = fixture.service.confirmDelete(message);
  const cancelButton = fixture.dialogRoot.querySelector("[data-confirm-cancel]");
  const confirmButton = fixture.dialogRoot.querySelector("[data-confirm-accept]");

  assert.match(fixture.dialogRoot.innerHTML, /role="alertdialog"/);
  assert.equal(fixture.dialogRoot.querySelector("[data-confirm-message]").textContent, message);
  assert.equal(cancelButton.focusCount, 1);
  assert.equal(fixture.document.body.classList.contains("has-dialog"), true);
  assert.equal(fixture.document.pageRoot.hasAttribute("inert"), true);

  fixture.document.dispatch("keydown", { key: "Tab", shiftKey: true });
  assert.equal(confirmButton.focusCount, 1);
  fixture.document.dispatch("keydown", { key: "Tab" });
  assert.equal(cancelButton.focusCount, 2);

  confirmButton.dispatch("click");

  assert.equal(await result, true);
  assert.equal(fixture.dialogRoot.innerHTML, "");
  assert.equal(fixture.document.body.classList.contains("has-dialog"), false);
  assert.equal(fixture.document.pageRoot.hasAttribute("inert"), false);
  assert.equal(fixture.previousFocus.focusCount, 1);
});

test("Escape cancela la eliminación sin ejecutar la acción", async () => {
  const fixture = createDialogFixture();
  const result = fixture.service.confirmDelete("¿Eliminar este registro?");
  const event = fixture.document.dispatch("keydown", { key: "Escape" });

  assert.equal(await result, false);
  assert.equal(event.defaultPrevented, true);
  assert.equal(fixture.dialogRoot.innerHTML, "");
});

test("pulsar el fondo cancela, pero pulsar dentro del modal no lo cierra", async () => {
  const fixture = createDialogFixture();
  let settled = false;
  const result = fixture.service.confirmDelete("¿Eliminar este registro?");
  result.then(() => { settled = true; });

  const backdrop = fixture.dialogRoot.querySelector("[data-confirm-backdrop]");
  backdrop.dispatch("click", { target: new FakeEventTarget(fixture.document) });
  await Promise.resolve();
  assert.equal(settled, false);

  backdrop.dispatch("click", { target: backdrop });
  assert.equal(await result, false);
});
