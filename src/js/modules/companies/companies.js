import {
  appendChildren,
  createButton,
  createElement,
  createEmptyState,
  createField,
  formatCurrency,
  formatInteger
} from "../../core/dom-utils.js";

export const moduleMeta = Object.freeze({
  id: "companies",
  label: "Empresas clientes"
});

let destroyCurrentMount = null;

function normalizeCompany(cart) {
  const products = Array.isArray(cart.products) ? cart.products : [];
  const firstProduct = products[0] || {};
  const id = Number(cart.id);
  const userId = Number(cart.userId) || 1;

  return {
    ...cart,
    id,
    userId,
    products,
    companyName: String(cart.companyName || `Empresa cliente ${id}`),
    contactName: String(cart.contactName || `Responsable de cuenta ${userId}`),
    productId: Number(cart.productId || firstProduct.id) || 1,
    quantity: Number(cart.quantity || firstProduct.quantity || cart.totalQuantity) || 1,
    totalProducts: Number(cart.totalProducts) || products.length,
    totalQuantity: Number(cart.totalQuantity) || 0,
    total: Number(cart.total) || 0
  };
}

function validateServices(services) {
  const hasApi = services?.api
    && ["get", "post", "put", "remove"].every((method) => typeof services.api[method] === "function");
  const hasFeedback = services?.feedback
    && ["loading", "success", "error", "clear", "confirmDelete"].every((method) => typeof services.feedback[method] === "function");

  if (!hasApi || !hasFeedback) {
    throw new TypeError("Empresas clientes requiere los servicios api y feedback del contrato.");
  }
}

export async function mount(container, services) {
  unmount();

  if (!(container instanceof HTMLElement)) {
    throw new TypeError("Empresas clientes requiere un container válido.");
  }

  validateServices(services);

  let isActive = true;
  let isBusy = false;
  let editingId = null;
  let companies = [];

  const root = createElement("section", {
    className: "module module--companies",
    attributes: { "aria-labelledby": "companies-title" }
  });
  const header = createElement("header", { className: "module__header" });
  const headerText = createElement("div");
  const eyebrow = createElement("p", {
    className: "module__eyebrow",
    text: "Relaciones comerciales"
  });
  const title = createElement("h2", {
    text: "Empresas clientes",
    attributes: { id: "companies-title" }
  });
  const description = createElement("p", {
    className: "module__description",
    text: "Administra las cuentas empresariales representadas por carts de DummyJSON y conserva localmente las mutaciones simuladas."
  });
  const form = createElement("form", {
    className: "module__form",
    attributes: { novalidate: "" }
  });
  const formTitle = createElement("h3", { text: "Registrar empresa cliente" });
  const formGrid = createElement("div", { className: "module__form-grid" });
  const companyNameField = createField({
    id: "company-name",
    name: "companyName",
    label: "Nombre de la empresa",
    placeholder: "Ej. Soluciones del Valle",
    required: true
  });
  const contactNameField = createField({
    id: "company-contact",
    name: "contactName",
    label: "Persona de contacto",
    placeholder: "Nombre del contacto",
    required: true
  });
  const userIdField = createField({
    id: "company-user-id",
    name: "userId",
    label: "ID de cuenta en DummyJSON",
    type: "number",
    min: 1,
    step: 1,
    required: true
  });
  const productIdField = createField({
    id: "company-product-id",
    name: "productId",
    label: "ID de referencia",
    type: "number",
    min: 1,
    step: 1,
    hint: "DummyJSON requiere un producto para simular el cart.",
    required: true
  });
  const quantityField = createField({
    id: "company-quantity",
    name: "quantity",
    label: "Cantidad asociada",
    type: "number",
    min: 1,
    step: 1,
    required: true
  });
  const formActions = createElement("div", { className: "module__form-actions" });
  const submitButton = createButton("Crear empresa", "submit", {
    variant: "primary",
    type: "submit"
  });
  const cancelButton = createButton("Cancelar edición", "cancel-edit", {
    variant: "secondary",
    className: "is-hidden"
  });
  const listHeader = createElement("div", { className: "module__list-header" });
  const listTitle = createElement("h3", { text: "Directorio de empresas" });
  const count = createElement("span", {
    className: "module__count",
    text: "0 registros"
  });
  const list = createElement("div", {
    className: "record-grid module--companies__list",
    attributes: { "aria-busy": "false" }
  });

  companyNameField.control.minLength = 3;
  contactNameField.control.minLength = 3;
  userIdField.control.value = "1";
  productIdField.control.value = "1";
  quantityField.control.value = "1";

  appendChildren(headerText, eyebrow, title, description);
  header.append(headerText);
  appendChildren(
    formGrid,
    companyNameField.group,
    contactNameField.group,
    userIdField.group,
    productIdField.group,
    quantityField.group
  );
  appendChildren(formActions, submitButton, cancelButton);
  appendChildren(form, formTitle, formGrid, formActions);
  appendChildren(listHeader, listTitle, count);
  appendChildren(root, header, form, listHeader, list);
  container.replaceChildren(root);

  const setBusy = (busy) => {
    isBusy = busy;
    list.setAttribute("aria-busy", String(busy));

    for (const button of root.querySelectorAll("button")) {
      button.disabled = busy;
    }
  };

  const resetForm = () => {
    editingId = null;
    form.reset();
    userIdField.control.value = "1";
    productIdField.control.value = "1";
    quantityField.control.value = "1";
    formTitle.textContent = "Registrar empresa cliente";
    submitButton.textContent = "Crear empresa";
    cancelButton.classList.add("is-hidden");
  };

  const readForm = () => {
    const companyName = companyNameField.control.value.trim();
    const contactName = contactNameField.control.value.trim();
    const userId = Number(userIdField.control.value);
    const productId = Number(productIdField.control.value);
    const quantity = Number(quantityField.control.value);

    companyNameField.control.setCustomValidity(companyName.length >= 3 ? "" : "Escribe un nombre de empresa válido.");
    contactNameField.control.setCustomValidity(contactName.length >= 3 ? "" : "Escribe un nombre de contacto válido.");
    userIdField.control.setCustomValidity(Number.isInteger(userId) && userId > 0 ? "" : "Ingresa un ID de cuenta válido.");
    productIdField.control.setCustomValidity(Number.isInteger(productId) && productId > 0 ? "" : "Ingresa un ID de referencia válido.");
    quantityField.control.setCustomValidity(Number.isInteger(quantity) && quantity > 0 ? "" : "Ingresa una cantidad válida.");

    if (!form.reportValidity()) {
      services.feedback.error("Revisa los campos marcados antes de continuar.");
      return null;
    }

    return {
      companyName,
      contactName,
      userId,
      productId,
      quantity,
      products: [{ id: productId, quantity }]
    };
  };

  const renderList = () => {
    list.replaceChildren();
    count.textContent = `${companies.length} ${companies.length === 1 ? "registro" : "registros"}`;

    if (companies.length === 0) {
      list.append(createEmptyState(
        "No hay empresas registradas",
        "Utiliza el formulario para crear la primera cuenta empresarial local."
      ));
      return;
    }

    for (const company of companies) {
      const card = createElement("article", {
        className: "card record-card module--companies__card",
        attributes: { "aria-labelledby": `company-record-${company.id}` }
      });
      const status = createElement("span", {
        className: "status-badge",
        text: "Cliente activo"
      });
      const cardTitle = createElement("h3", {
        className: "record-card__title",
        text: company.companyName,
        attributes: { id: `company-record-${company.id}` }
      });
      const contact = createElement("p", {
        className: "record-card__description module--companies__contact",
        text: `Contacto: ${company.contactName}`
      });
      const metadata = createElement("ul", {
        className: "record-card__meta",
        attributes: { "aria-label": "Detalles de la empresa" }
      });
      const account = createElement("li", {
        className: "record-card__meta-item",
        text: `Cuenta ${company.userId}`
      });
      const positions = createElement("li", {
        className: "record-card__meta-item",
        text: `${formatInteger(company.totalProducts)} referencias`
      });
      const quantity = createElement("li", {
        className: "record-card__meta-item",
        text: `${formatInteger(company.totalQuantity)} unidades`
      });
      const budget = createElement("p", {
        className: "module--companies__budget",
        text: `Valor de referencia: ${formatCurrency(company.total)}`
      });
      const actions = createElement("div", {
        className: "record-card__actions",
        attributes: { "aria-label": `Acciones de ${company.companyName}` }
      });
      const editButton = createButton("Editar", "edit", { id: company.id });
      const deleteButton = createButton("Eliminar", "delete", {
        id: company.id,
        variant: "danger"
      });

      appendChildren(metadata, account, positions, quantity);
      appendChildren(actions, editButton, deleteButton);
      appendChildren(card, status, cardTitle, contact, metadata, budget, actions);
      list.append(card);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isBusy) {
      return;
    }

    const data = readForm();

    if (!data) {
      return;
    }

    setBusy(true);
    services.feedback.loading(editingId ? "Actualizando empresa cliente." : "Creando empresa cliente.");

    try {
      if (editingId) {
        const response = await services.api.put(`/carts/${editingId}`, data);

        if (!isActive) {
          return;
        }

        companies = companies.map((company) => company.id === editingId
          ? normalizeCompany({ ...company, ...response, ...data, id: editingId })
          : company);
        services.feedback.success("La empresa fue actualizada mediante PUT.");
      } else {
        const response = await services.api.post("/carts/add", data);

        if (!isActive) {
          return;
        }

        const fallbackId = companies.reduce((highest, company) => Math.max(highest, company.id), 0) + 1;
        companies = [
          normalizeCompany({ ...response, ...data, id: Number(response?.id) || fallbackId }),
          ...companies
        ];
        services.feedback.success("La empresa fue creada y añadida al estado local.");
      }

      resetForm();
      renderList();
    } catch (error) {
      if (isActive) {
        services.feedback.error(error.message);
      }
    } finally {
      if (isActive) {
        setBusy(false);
      }
    }
  };

  const handleListClick = async (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button || !list.contains(button) || isBusy) {
      return;
    }

    const companyId = Number(button.dataset.id);
    const company = companies.find((item) => item.id === companyId);

    if (!company) {
      services.feedback.error("No se encontró la empresa seleccionada.");
      return;
    }

    if (button.dataset.action === "edit") {
      editingId = company.id;
      companyNameField.control.value = company.companyName;
      contactNameField.control.value = company.contactName;
      userIdField.control.value = String(company.userId);
      productIdField.control.value = String(company.productId);
      quantityField.control.value = String(company.quantity);
      formTitle.textContent = `Editar: ${company.companyName}`;
      submitButton.textContent = "Guardar cambios";
      cancelButton.classList.remove("is-hidden");
      companyNameField.control.focus();
      return;
    }

    if (button.dataset.action === "delete") {
      const confirmed = await services.feedback.confirmDelete(`¿Eliminar la empresa “${company.companyName}”?`);

      if (!confirmed || !isActive) {
        return;
      }

      setBusy(true);
      services.feedback.loading("Eliminando empresa cliente.");

      try {
        await services.api.remove(`/carts/${company.id}`);

        if (!isActive) {
          return;
        }

        companies = companies.filter((item) => item.id !== company.id);

        if (editingId === company.id) {
          resetForm();
        }

        renderList();
        services.feedback.success("La empresa fue eliminada del estado local.");
      } catch (error) {
        if (isActive) {
          services.feedback.error(error.message);
        }
      } finally {
        if (isActive) {
          setBusy(false);
        }
      }
    }
  };

  const handleFormClick = (event) => {
    if (event.target.closest("button[data-action='cancel-edit']")) {
      resetForm();
      services.feedback.clear();
    }
  };

  form.addEventListener("submit", handleSubmit);
  form.addEventListener("click", handleFormClick);
  list.addEventListener("click", handleListClick);

  destroyCurrentMount = () => {
    isActive = false;
    form.removeEventListener("submit", handleSubmit);
    form.removeEventListener("click", handleFormClick);
    list.removeEventListener("click", handleListClick);
    root.remove();
  };

  services.feedback.loading("Cargando empresas clientes.");

  try {
    const response = await services.api.get("/carts?limit=12");

    if (!isActive) {
      return;
    }

    companies = Array.isArray(response?.carts)
      ? response.carts.map(normalizeCompany)
      : [];
    renderList();
    services.feedback.clear();
  } catch (error) {
    if (isActive) {
      companies = [];
      renderList();
      services.feedback.error(error.message);
    }
  }
}

export function unmount() {
  if (destroyCurrentMount) {
    destroyCurrentMount();
    destroyCurrentMount = null;
  }
}
