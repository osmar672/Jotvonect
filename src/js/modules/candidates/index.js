import { createCrudModule } from "../../core/crud-module.js";

export const moduleMeta = Object.freeze({
  id: "candidates",
  label: "Candidatos",
  shortLabel: "CA"
});

export const moduleConfig = Object.freeze({
  moduleMeta,
  description: "Administra los datos de las personas candidatas.",
  resourcePath: "/users",
  createPath: "/users/add",
  listKey: "users",
  updateMethods: ["put", "patch"],
  fields: [
    { name: "firstName", label: "Nombre", required: true, autocomplete: "given-name" },
    { name: "lastName", label: "Apellido", required: true, autocomplete: "family-name" },
    { name: "email", label: "Correo", type: "email", required: true, autocomplete: "email" },
    { name: "phone", label: "Teléfono", type: "tel", required: true, autocomplete: "tel" }
  ],
  card: item => ({
    title: `${item.firstName || "Sin nombre"} ${item.lastName || ""}`.trim(),
    description: item.email || "Sin correo registrado",
    status: "TALENTO",
    meta: [`ID: ${item.id ?? "local"}`, item.phone || "Sin teléfono"]
  })
});

const controller = createCrudModule(moduleConfig);

export const mount = (container, services) => controller.mount(container, services);
export const unmount = () => controller.unmount();
