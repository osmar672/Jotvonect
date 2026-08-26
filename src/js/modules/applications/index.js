import { createCrudModule } from "../../core/crud-module.js";

export const moduleMeta = Object.freeze({
  id: "applications",
  label: "Postulaciones",
  shortLabel: "PO"
});

export const moduleConfig = Object.freeze({
  moduleMeta,
  description: "Registra y actualiza postulaciones de candidatos.",
  resourcePath: "/posts",
  createPath: "/posts/add",
  listKey: "posts",
  updateMethods: ["patch"],
  fields: [
    { name: "title", label: "Título", required: true },
    { name: "body", label: "Detalle de la postulación", type: "textarea", required: true },
    { name: "userId", label: "ID del candidato", type: "number", min: 1, required: true }
  ],
  card: item => ({
    title: item.title || "Postulación sin título",
    description: item.body || "Sin detalle",
    status: "EN PROCESO",
    meta: [`ID: ${item.id ?? "local"}`, `Candidato: ${item.userId ?? "sin asignar"}`]
  })
});

const controller = createCrudModule(moduleConfig);

export const mount = (container, services) => controller.mount(container, services);
export const unmount = () => controller.unmount();
