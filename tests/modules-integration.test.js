import assert from "node:assert/strict";
import test from "node:test";

import * as applications from "../src/js/modules/applications/index.js";
import * as candidates from "../src/js/modules/candidates/index.js";
import * as companies from "../src/js/modules/companies/index.js";
import * as home from "../src/js/modules/home/index.js";
import * as interviews from "../src/js/modules/interviews/index.js";
import * as tasks from "../src/js/modules/tasks/index.js";
import * as vacancies from "../src/js/modules/vacancies/index.js";
import { buildNavigationMarkup } from "../src/js/ui/shell.js";

const modules = [candidates, vacancies, companies, applications, interviews, tasks];
const navigationModules = [home, ...modules];

const expectedMatrix = [
  { id: "candidates", resource: "/users", create: "/users/add", updates: ["put", "patch"] },
  { id: "vacancies", resource: "/products", create: "/products/add", updates: ["put", "patch"] },
  { id: "companies", resource: "/carts", create: "/carts/add", updates: ["put"] },
  { id: "applications", resource: "/posts", create: "/posts/add", updates: ["patch"] },
  { id: "interviews", resource: "/comments", create: "/comments/add", updates: ["patch"] },
  { id: "tasks", resource: "/todos", create: "/todos/add", updates: ["patch"] }
];

const sampleItems = {
  candidates: { id: 1, firstName: "Emily", lastName: "Johnson", email: "emily@example.com", phone: "8888-8888" },
  vacancies: { id: 1, title: "Frontend", description: "Vacante web", category: "software", price: 1500 },
  companies: { id: 1, userId: 4, products: [{ id: 2, quantity: 3 }], totalProducts: 1, totalQuantity: 3 },
  applications: { id: 1, title: "Postulación", body: "Candidato frontend", userId: 5 },
  interviews: { id: 1, body: "Entrevista técnica", postId: 1, user: { id: 7 } },
  tasks: { id: 1, todo: "Revisar currículo", completed: false, userId: 8 }
};

function createFakeForm(fields) {
  const inputs = new Map(fields.map(field => [field.name, {
    name: field.name,
    value: field.type === "number" ? "2" : `Valor ${field.name}`,
    checked: false,
    focus() {}
  }]));
  const submitButton = { disabled: false, textContent: "Guardar" };

  return {
    hidden: false,
    attributes: {},
    elements: { namedItem: name => inputs.get(name) || null },
    reportValidity: () => true,
    reset() {},
    scrollIntoView() {},
    setAttribute(name, value) { this.attributes[name] = value; },
    querySelector(selector) {
      if (selector === "[data-submit]") return submitButton;
      if (selector === "input, textarea, select") return inputs.values().next().value;
      return null;
    },
    inputs,
    submitButton
  };
}

function createFakeDom(config) {
  const handlers = { click: [], submit: [] };
  const form = createFakeForm(config.fields);
  const state = { hidden: false, className: "", textContent: "" };
  const list = { innerHTML: "" };
  const count = { textContent: "" };
  const search = { value: "", addEventListener() {}, removeEventListener() {} };
  const formTitle = { textContent: "" };
  const formMethod = { textContent: "" };

  const elements = {
    "[data-form]": form,
    "[data-state]": state,
    "[data-list]": list,
    "[data-count]": count,
    "[data-search]": search,
    "[data-form-title]": formTitle,
    "[data-form-method]": formMethod
  };

  const container = {
    innerHTML: "",
    addEventListener(type, handler) { handlers[type].push(handler); },
    removeEventListener() {},
    contains: () => true,
    querySelector: selector => elements[selector] || null,
    replaceChildren() { this.innerHTML = ""; }
  };

  function dispatch(type, action, dataset = {}) {
    const target = {
      dataset,
      closest: selector => selector === action ? (action === "[data-form]" ? form : target) : null
    };
    const event = {
      target,
      preventDefault() {}
    };

    for (const handler of handlers[type]) handler(event);
  }

  return { container, form, state, list, count, dispatch };
}

function createServices(config) {
  const calls = [];
  const feedbackMessages = [];

  const api = {
    get: async path => {
      calls.push({ method: "get", path });
      return { [config.listKey]: [sampleItems[config.moduleMeta.id]] };
    },
    post: async (path, payload) => {
      calls.push({ method: "post", path, payload });
      return { id: 999, ...payload };
    },
    put: async (path, payload) => {
      calls.push({ method: "put", path, payload });
      return { id: 1, ...payload };
    },
    patch: async (path, payload) => {
      calls.push({ method: "patch", path, payload });
      return { id: 1, ...payload };
    },
    remove: async path => {
      calls.push({ method: "remove", path });
      return { id: 1, isDeleted: true };
    }
  };

  const feedback = {
    loading: message => feedbackMessages.push({ type: "loading", message }),
    success: message => feedbackMessages.push({ type: "success", message }),
    error: message => feedbackMessages.push({ type: "error", message }),
    clear() {},
    confirmDelete: async () => true
  };

  return { api, feedback, calls, feedbackMessages };
}

async function flushAsyncActions() {
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
}

test("el menú contiene Inicio y los seis módulos de gestión", () => {
  const markup = buildNavigationMarkup(navigationModules);

  for (const module of navigationModules) {
    assert.match(markup, new RegExp(`data-module="${module.moduleMeta.id}"`));
    assert.match(markup, new RegExp(module.moduleMeta.label));
  }

  assert.doesNotMatch(markup, /undefined/);
  assert.match(markup, /data-module="home"/);
});

test("la matriz de recursos y métodos coincide con el enunciado y DummyJSON", () => {
  assert.deepEqual(modules.map(module => ({
    id: module.moduleConfig.moduleMeta.id,
    resource: module.moduleConfig.resourcePath,
    create: module.moduleConfig.createPath,
    updates: [...module.moduleConfig.updateMethods]
  })), expectedMatrix);
});

for (const module of modules) {
  test(`${module.moduleMeta.label}: GET, formulario POST, actualizaciones y DELETE están conectados`, async () => {
    const config = module.moduleConfig;
    const dom = createFakeDom(config);
    const services = createServices(config);

    await module.mount(dom.container, services);

    assert.deepEqual(services.calls[0], { method: "get", path: config.resourcePath });
    assert.match(dom.container.innerHTML, /data-form-panel/);
    assert.match(dom.container.innerHTML, /data-view-mode="grid"/);
    assert.match(dom.container.innerHTML, /data-stat-total/);
    assert.match(dom.list.innerHTML, /data-action="edit"/);
    assert.match(dom.list.innerHTML, /data-action="delete"/);

    dom.dispatch("submit", "[data-form]");
    await flushAsyncActions();

    assert.ok(services.calls.some(call => call.method === "post" && call.path === config.createPath));
    assert.ok(services.feedbackMessages.some(message => message.type === "success"));
    assert.equal(services.feedbackMessages.some(message => message.type === "error"), false);

    for (const method of config.updateMethods) {
      dom.dispatch("click", "[data-action='edit']", { key: "server:1", method });
      dom.form.inputs.values().next().value.value = "Dato actualizado";
      dom.dispatch("submit", "[data-form]");
      await flushAsyncActions();

      assert.ok(services.calls.some(call => call.method === method && call.path === `${config.resourcePath}/1`));
    }

    dom.dispatch("click", "[data-action='delete']", { key: "server:1" });
    await flushAsyncActions();

    assert.ok(services.calls.some(call => call.method === "remove" && call.path === `${config.resourcePath}/1`));
    module.unmount();
  });
}
