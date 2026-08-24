import { createCrudModule } from "../../core/crud-module.js";

export const moduleMeta = Object.freeze({
  id: "vacancies",
  label: "Vacantes",
  shortLabel: "VA"
});

export const moduleConfig = Object.freeze({
  moduleMeta,
  description: "Gestiona las oportunidades de empleo disponibles.",
  resourcePath: "/products",
  createPath: "/products/add",
  listKey: "products",
  updateMethods: ["put", "patch"],
  fields: [
    { name: "title", label: "Título de la vacante", required: true },
    { name: "description", label: "Descripción", type: "textarea", required: true },
    { name: "category", label: "Área o categoría", required: true },
    { name: "price", label: "Referencia salarial", type: "number", min: 0, step: 0.01, required: true }
  ],
  card: item => ({
    title: item.title || "Vacante sin título",
    description: item.description || "Sin descripción",
    status: "VACANTE",
    meta: [
      `ID: ${item.id ?? "local"}`,
      `Área: ${item.category || "sin categoría"}`,
      `Referencia: $${Number(item.price || 0).toFixed(2)}`
    ]
  })
});

const controller = createCrudModule(moduleConfig);

export const mount = (container, services) => controller.mount(container, services);
export const unmount = () => controller.unmount();
