import { createCrudModule } from "../../core/crud-module.js";

export const moduleMeta = Object.freeze({
  id: "tasks",
  label: "Tareas",
  shortLabel: "TA"
});

export const moduleConfig = Object.freeze({
  moduleMeta,
  description: "Organiza las tareas pendientes de los reclutadores.",
  resourcePath: "/todos",
  createPath: "/todos/add",
  listKey: "todos",
  updateMethods: ["patch"],
  fields: [
    { name: "todo", label: "Descripción de la tarea", type: "textarea", required: true },
    { name: "completed", label: "Tarea completada", type: "checkbox", defaultValue: false },
    { name: "userId", label: "ID del reclutador", type: "number", min: 1, required: true }
  ],
  card: item => ({
    title: item.todo || "Tarea sin descripción",
    description: item.completed ? "Estado: completada" : "Estado: pendiente",
    status: item.completed ? "COMPLETADA" : "PENDIENTE",
    meta: [`ID: ${item.id ?? "local"}`, `Reclutador: ${item.userId ?? "sin asignar"}`]
  })
});

const controller = createCrudModule(moduleConfig);

export const mount = (container, services) => controller.mount(container, services);
export const unmount = () => controller.unmount();
