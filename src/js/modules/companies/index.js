import { createCrudModule } from "../../core/crud-module.js";

export const moduleMeta = Object.freeze({
  id: "companies",
  label: "Empresas clientes",
  shortLabel: "EM"
});

export const moduleConfig = Object.freeze({
  moduleMeta,
  description: "Representa empresas mediante los carritos y responsables de DummyJSON.",
  resourcePath: "/carts",
  createPath: "/carts/add",
  listKey: "carts",
  updateMethods: ["put"],
  fields: [
    {
      name: "companyName",
      label: "Nombre de referencia",
      required: true,
      getValue: item => item.companyName || `Empresa cliente ${item.id ?? "local"}`
    },
    { name: "userId", label: "ID del responsable", type: "number", min: 1, required: true },
    {
      name: "productId",
      label: "ID de vacante asociada",
      type: "number",
      min: 1,
      required: true,
      getValue: item => item.products?.[0]?.id ?? 1
    },
    {
      name: "quantity",
      label: "Cantidad de posiciones",
      type: "number",
      min: 1,
      required: true,
      getValue: item => item.products?.[0]?.quantity ?? 1
    }
  ],
  buildPayload: values => ({
    companyName: values.companyName,
    userId: values.userId,
    products: [{ id: values.productId, quantity: values.quantity }]
  }),
  card: item => ({
    title: item.companyName || `Empresa cliente #${item.id ?? "local"}`,
    description: `Responsable asociado: usuario ${item.userId ?? "sin asignar"}`,
    status: "EMPRESA",
    meta: [
      `ID: ${item.id ?? "local"}`,
      `Vacantes asociadas: ${item.totalProducts ?? item.products?.length ?? 0}`,
      `Posiciones: ${item.totalQuantity ?? item.products?.reduce((total, product) => total + Number(product.quantity || 0), 0) ?? 0}`
    ]
  })
});

const controller = createCrudModule(moduleConfig);

export const mount = (container, services) => controller.mount(container, services);
export const unmount = () => controller.unmount();
