import { createCrudModule } from "../../core/crud-module.js";

export const moduleMeta = Object.freeze({
  id: "interviews",
  label: "Entrevistas y notas",
  shortLabel: "EN"
});

export const moduleConfig = Object.freeze({
  moduleMeta,
  description: "Conserva notas relacionadas con entrevistas y postulaciones.",
  resourcePath: "/comments",
  createPath: "/comments/add",
  listKey: "comments",
  updateMethods: ["patch"],
  fields: [
    { name: "body", label: "Nota de entrevista", type: "textarea", required: true },
    { name: "postId", label: "ID de la postulación", type: "number", min: 1, required: true },
    {
      name: "userId",
      label: "ID del reclutador",
      type: "number",
      min: 1,
      required: true,
      getValue: item => item.userId ?? item.user?.id ?? 1
    }
  ],
  card: item => ({
    title: `Entrevista #${item.id ?? "local"}`,
    description: item.body || "Sin notas",
    status: "SEGUIMIENTO",
    meta: [
      `Postulación: ${item.postId ?? "sin asignar"}`,
      `Reclutador: ${item.userId ?? item.user?.id ?? "sin asignar"}`
    ]
  })
});

const controller = createCrudModule(moduleConfig);

export const mount = (container, services) => controller.mount(container, services);
export const unmount = () => controller.unmount();
