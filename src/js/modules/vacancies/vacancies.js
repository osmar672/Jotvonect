import {
  appendChildren,
  createButton,
  createElement,
  createEmptyState,
  createField,
  formatCurrency
} from "../../core/dom-utils.js";

export const moduleMeta = Object.freeze({
  id: "vacancies",
  label: "Vacantes"
});

let destroyCurrentMount = null;

function normalizeVacancy(vacancy) {
  return {
    ...vacancy,
    id: Number(vacancy.id),
    title: String(vacancy.title || "Vacante sin título"),
    description: String(vacancy.description || "Sin descripción disponible."),
    category: String(vacancy.category || "general"),
    price: Number(vacancy.price) || 0,
    isFeatured: Boolean(vacancy.isFeatured)
  };
}

function validateServices(services) {
  const hasApi = services?.api
    && ["get", "post", "put", "patch", "remove"].every((method) => typeof services.api[method] === "function");
  const hasFeedback = services?.feedback
    && ["loading", "success", "error", "clear", "confirmDelete"].every((method) => typeof services.feedback[method] === "function");

  if (!hasApi || !hasFeedback) {
    throw new TypeError("Vacantes requiere los servicios api y feedback del contrato.");
  }
}

export async function mount(container, services) {
  unmount();

  if (!(container instanceof HTMLElement)) {
    throw new TypeError("Vacantes requiere un container válido.");
  }

  validateServices(services);

  let isActive = true;
  let isBusy = false;
  let editingId = null;
  let vacancies = [];

  const root = createElement("section", {
    className: "module module--vacancies",
    attributes: { "aria-labelledby": "vacancies-title" }
  });
  const header = createElement("header", { className: "module__header" });
  const headerText = createElement("div");
  const eyebrow = createElement("p", {
    className: "module__eyebrow",
    text: "Gestión de talento"
  });
  const title = createElement("h2", {
    text: "Vacantes",
    attributes: { id: "vacancies-title" }
  });
  const description = createElement("p", {
    className: "module__description",
    text: "Publica, actualiza, destaca y retira oportunidades laborales. Los cambios se conservan localmente durante la sesión."
  });
  const form = createElement("form", {
    className: "module__form",
    attributes: { novalidate: "" }
  });
  const formTitle = createElement("h3", { text: "Registrar vacante" });
  const formGrid = createElement("div", { className: "module__form-grid" });
  const titleField = createField({
    id: "vacancy-title",
    name: "title",
    label: "Título de la vacante",
    placeholder: "Ej. Desarrollador frontend",
    required: true
  });
  const categoryField = createField({
    id: "vacancy-category",
    name: "category",
    label: "Área o categoría",
    placeholder: "Ej. Tecnología",
    required: true
  });
  const priceField = createField({
    id: "vacancy-price",
    name: "price",
    label: "Referencia salarial (USD)",
    type: "number",
    min: 0,
    step: 0.01,
    hint: "DummyJSON utiliza el campo price como referencia.",
    required: true
  });
  const descriptionField = createField({
    id: "vacancy-description",
    name: "description",
    label: "Descripción",
    placeholder: "Responsabilidades y perfil requerido",
    rows: 5,
    required: true,
    fullWidth: true
  });
  const formActions = createElement("div", { className: "module__form-actions" });
  const submitButton = createButton("Crear vacante", "submit", {
    variant: "primary",
    type: "submit"
  });
  const cancelButton = createButton("Cancelar edición", "cancel-edit", {
    variant: "secondary",
    className: "is-hidden"
  });
  const listHeader = createElement("div", { className: "module__list-header" });
  const listTitle = createElement("h3", { text: "Vacantes registradas" });
  const count = createElement("span", {
    className: "module__count",
    text: "0 registros"
  });
  const list = createElement("div", {
    className: "record-grid module--vacancies__list",
    attributes: { "aria-busy": "false" }
  });

  titleField.control.minLength = 3;
  categoryField.control.minLength = 2;
  descriptionField.control.minLength = 10;

  appendChildren(headerText, eyebrow, title, description);
  header.append(headerText);
  appendChildren(formGrid, titleField.group, categoryField.group, priceField.group, descriptionField.group);
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
    formTitle.textContent = "Registrar vacante";
    submitButton.textContent = "Crear vacante";
    cancelButton.classList.add("is-hidden");
  };

  const readForm = () => {
    const titleValue = titleField.control.value.trim();
    const categoryValue = categoryField.control.value.trim();
    const descriptionValue = descriptionField.control.value.trim();
    const priceValue = Number(priceField.control.value);

    titleField.control.setCustomValidity(titleValue.length >= 3 ? "" : "Escribe un título de al menos 3 caracteres.");
    categoryField.control.setCustomValidity(categoryValue.length >= 2 ? "" : "Escribe una categoría válida.");
    descriptionField.control.setCustomValidity(descriptionValue.length >= 10 ? "" : "La descripción debe tener al menos 10 caracteres.");
    priceField.control.setCustomValidity(Number.isFinite(priceValue) && priceValue >= 0 ? "" : "Ingresa una referencia salarial válida.");

    if (!form.reportValidity()) {
      services.feedback.error("Revisa los campos marcados antes de continuar.");
      return null;
    }

    return {
      title: titleValue,
      category: categoryValue,
      description: descriptionValue,
      price: priceValue
    };
  };

  const renderList = () => {
    list.replaceChildren();
    count.textContent = `${vacancies.length} ${vacancies.length === 1 ? "registro" : "registros"}`;

    if (vacancies.length === 0) {
      list.append(createEmptyState(
        "No hay vacantes disponibles",
        "Crea una vacante con el formulario para iniciar el registro local."
      ));
      return;
    }

    for (const vacancy of vacancies) {
      const card = createElement("article", {
        className: `card record-card module--vacancies__card${vacancy.isFeatured ? " module--vacancies__card--featured" : ""}`,
        attributes: { "aria-labelledby": `vacancy-record-${vacancy.id}` }
      });
      const status = createElement("span", {
        className: `status-badge${vacancy.isFeatured ? "" : " status-badge--muted"}`,
        text: vacancy.isFeatured ? "Destacada" : "Activa"
      });
      const cardTitle = createElement("h3", {
        className: "record-card__title",
        text: vacancy.title,
        attributes: { id: `vacancy-record-${vacancy.id}` }
      });
      const cardDescription = createElement("p", {
        className: "record-card__description",
        text: vacancy.description
      });
      const metadata = createElement("ul", {
        className: "record-card__meta",
        attributes: { "aria-label": "Detalles de la vacante" }
      });
      const category = createElement("li", {
        className: "record-card__meta-item",
        text: vacancy.category
      });
      const salary = createElement("li", {
        className: "record-card__meta-item module--vacancies__salary",
        text: `Referencia: ${formatCurrency(vacancy.price)}`
      });
      const actions = createElement("div", {
        className: "record-card__actions",
        attributes: { "aria-label": `Acciones de ${vacancy.title}` }
      });
      const editButton = createButton("Editar", "edit", { id: vacancy.id });
      const featureButton = createButton(
        vacancy.isFeatured ? "Quitar destaque" : "Destacar",
        "toggle-featured",
        { id: vacancy.id, variant: "quiet" }
      );
      const deleteButton = createButton("Eliminar", "delete", {
        id: vacancy.id,
        variant: "danger"
      });

      appendChildren(metadata, category, salary);
      appendChildren(actions, editButton, featureButton, deleteButton);
      appendChildren(card, status, cardTitle, cardDescription, metadata, actions);
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
    services.feedback.loading(editingId ? "Actualizando vacante." : "Creando vacante.");

    try {
      if (editingId) {
        const response = await services.api.put(`/products/${editingId}`, data);

        if (!isActive) {
          return;
        }

        vacancies = vacancies.map((vacancy) => vacancy.id === editingId
          ? normalizeVacancy({ ...vacancy, ...response, ...data, id: editingId })
          : vacancy);
        services.feedback.success("La vacante fue actualizada mediante PUT.");
      } else {
        const response = await services.api.post("/products/add", data);

        if (!isActive) {
          return;
        }

        const fallbackId = vacancies.reduce((highest, vacancy) => Math.max(highest, vacancy.id), 0) + 1;
        vacancies = [
          normalizeVacancy({ ...response, ...data, id: Number(response?.id) || fallbackId }),
          ...vacancies
        ];
        services.feedback.success("La vacante fue creada y añadida al estado local.");
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

    const vacancyId = Number(button.dataset.id);
    const vacancy = vacancies.find((item) => item.id === vacancyId);

    if (!vacancy) {
      services.feedback.error("No se encontró la vacante seleccionada.");
      return;
    }

    if (button.dataset.action === "edit") {
      editingId = vacancy.id;
      titleField.control.value = vacancy.title;
      categoryField.control.value = vacancy.category;
      priceField.control.value = String(vacancy.price);
      descriptionField.control.value = vacancy.description;
      formTitle.textContent = `Editar: ${vacancy.title}`;
      submitButton.textContent = "Guardar cambios";
      cancelButton.classList.remove("is-hidden");
      titleField.control.focus();
      return;
    }

    if (button.dataset.action === "toggle-featured") {
      const nextFeaturedState = !vacancy.isFeatured;
      setBusy(true);
      services.feedback.loading(nextFeaturedState ? "Destacando vacante." : "Actualizando vacante.");

      try {
        const response = await services.api.patch(`/products/${vacancy.id}`, {
          isFeatured: nextFeaturedState
        });

        if (!isActive) {
          return;
        }

        vacancies = vacancies.map((item) => item.id === vacancy.id
          ? normalizeVacancy({ ...item, ...response, isFeatured: nextFeaturedState })
          : item);
        renderList();
        services.feedback.success("La vacante fue actualizada mediante PATCH.");
      } catch (error) {
        if (isActive) {
          services.feedback.error(error.message);
        }
      } finally {
        if (isActive) {
          setBusy(false);
        }
      }

      return;
    }

    if (button.dataset.action === "delete") {
      const confirmed = await services.feedback.confirmDelete(`¿Eliminar la vacante “${vacancy.title}”?`);

      if (!confirmed || !isActive) {
        return;
      }

      setBusy(true);
      services.feedback.loading("Eliminando vacante.");

      try {
        await services.api.remove(`/products/${vacancy.id}`);

        if (!isActive) {
          return;
        }

        vacancies = vacancies.filter((item) => item.id !== vacancy.id);

        if (editingId === vacancy.id) {
          resetForm();
        }

        renderList();
        services.feedback.success("La vacante fue eliminada del estado local.");
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

  services.feedback.loading("Cargando vacantes.");

  try {
    const response = await services.api.get("/products?limit=12&select=id,title,description,category,price");

    if (!isActive) {
      return;
    }

    vacancies = Array.isArray(response?.products)
      ? response.products.map(normalizeVacancy)
      : [];
    renderList();
    services.feedback.clear();
  } catch (error) {
    if (isActive) {
      vacancies = [];
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
