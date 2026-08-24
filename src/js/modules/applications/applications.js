import {
  appendChildren,
  createButton,
  createElement,
  createEmptyState,
  createField,
  formatInteger
} from "../../core/dom-utils.js";

export const moduleMeta = Object.freeze({
  id: "applications",
  label: "Postulaciones"
});

let destroyCurrentMount = null;

function normalizeApplication(post) {
  const reactions = post.reactions && typeof post.reactions === "object"
    ? post.reactions
    : { likes: 0, dislikes: 0 };

  return {
    ...post,
    id: Number(post.id),
    userId: Number(post.userId) || 1,
    title: String(post.title || "Postulación sin título"),
    body: String(post.body || "Sin información adicional."),
    reactions,
    views: Number(post.views) || 0
  };
}

function validateServices(services) {
  const hasApi = services?.api
    && ["get", "post", "patch", "remove"].every((method) => typeof services.api[method] === "function");
  const hasFeedback = services?.feedback
    && ["loading", "success", "error", "clear", "confirmDelete"].every((method) => typeof services.feedback[method] === "function");

  if (!hasApi || !hasFeedback) {
    throw new TypeError("Postulaciones requiere los servicios api y feedback del contrato.");
  }
}

export async function mount(container, services) {
  unmount();

  if (!(container instanceof HTMLElement)) {
    throw new TypeError("Postulaciones requiere un container válido.");
  }

  validateServices(services);

  let isActive = true;
  let isBusy = false;
  let editingId = null;
  let applications = [];

  const root = createElement("section", {
    className: "module module--applications",
    attributes: { "aria-labelledby": "applications-title" }
  });
  const header = createElement("header", { className: "module__header" });
  const headerText = createElement("div");
  const eyebrow = createElement("p", {
    className: "module__eyebrow",
    text: "Seguimiento de candidatos"
  });
  const title = createElement("h2", {
    text: "Postulaciones",
    attributes: { id: "applications-title" }
  });
  const description = createElement("p", {
    className: "module__description",
    text: "Registra y revisa postulaciones representadas por posts de DummyJSON. Las altas, ediciones y bajas se reflejan en el estado local."
  });
  const form = createElement("form", {
    className: "module__form",
    attributes: { novalidate: "" }
  });
  const formTitle = createElement("h3", { text: "Registrar postulación" });
  const formGrid = createElement("div", { className: "module__form-grid" });
  const titleField = createField({
    id: "application-title",
    name: "title",
    label: "Título de la postulación",
    placeholder: "Ej. Postulación para desarrollador frontend",
    required: true
  });
  const userIdField = createField({
    id: "application-user-id",
    name: "userId",
    label: "ID del candidato",
    type: "number",
    min: 1,
    step: 1,
    required: true
  });
  const bodyField = createField({
    id: "application-body",
    name: "body",
    label: "Resumen o carta de presentación",
    placeholder: "Experiencia, motivación y observaciones",
    rows: 6,
    required: true,
    fullWidth: true
  });
  const formActions = createElement("div", { className: "module__form-actions" });
  const submitButton = createButton("Crear postulación", "submit", {
    variant: "primary",
    type: "submit"
  });
  const cancelButton = createButton("Cancelar edición", "cancel-edit", {
    variant: "secondary",
    className: "is-hidden"
  });
  const listHeader = createElement("div", { className: "module__list-header" });
  const listTitle = createElement("h3", { text: "Postulaciones recibidas" });
  const count = createElement("span", {
    className: "module__count",
    text: "0 registros"
  });
  const list = createElement("div", {
    className: "record-grid module--applications__list",
    attributes: { "aria-busy": "false" }
  });

  titleField.control.minLength = 3;
  bodyField.control.minLength = 10;
  userIdField.control.value = "1";

  appendChildren(headerText, eyebrow, title, description);
  header.append(headerText);
  appendChildren(formGrid, titleField.group, userIdField.group, bodyField.group);
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
    formTitle.textContent = "Registrar postulación";
    submitButton.textContent = "Crear postulación";
    cancelButton.classList.add("is-hidden");
  };

  const readForm = () => {
    const titleValue = titleField.control.value.trim();
    const bodyValue = bodyField.control.value.trim();
    const userId = Number(userIdField.control.value);

    titleField.control.setCustomValidity(titleValue.length >= 3 ? "" : "Escribe un título de al menos 3 caracteres.");
    bodyField.control.setCustomValidity(bodyValue.length >= 10 ? "" : "Escribe un resumen de al menos 10 caracteres.");
    userIdField.control.setCustomValidity(Number.isInteger(userId) && userId > 0 ? "" : "Ingresa un ID de candidato válido.");

    if (!form.reportValidity()) {
      services.feedback.error("Revisa los campos marcados antes de continuar.");
      return null;
    }

    return {
      title: titleValue,
      body: bodyValue,
      userId
    };
  };

  const renderList = () => {
    list.replaceChildren();
    count.textContent = `${applications.length} ${applications.length === 1 ? "registro" : "registros"}`;

    if (applications.length === 0) {
      list.append(createEmptyState(
        "No hay postulaciones registradas",
        "Crea una postulación con el formulario para iniciar el seguimiento local."
      ));
      return;
    }

    for (const application of applications) {
      const card = createElement("article", {
        className: "card record-card module--applications__card",
        attributes: { "aria-labelledby": `application-record-${application.id}` }
      });
      const status = createElement("span", {
        className: "status-badge status-badge--warning",
        text: "En revisión"
      });
      const cardTitle = createElement("h3", {
        className: "record-card__title",
        text: application.title,
        attributes: { id: `application-record-${application.id}` }
      });
      const cardDescription = createElement("p", {
        className: "record-card__description",
        text: application.body
      });
      const metadata = createElement("ul", {
        className: "record-card__meta",
        attributes: { "aria-label": "Detalles de la postulación" }
      });
      const candidate = createElement("li", {
        className: "record-card__meta-item module--applications__candidate",
        text: `Candidato ${application.userId}`
      });
      const likes = createElement("li", {
        className: "record-card__meta-item",
        text: `${formatInteger(application.reactions.likes)} valoraciones`
      });
      const views = createElement("li", {
        className: "record-card__meta-item",
        text: `${formatInteger(application.views)} revisiones`
      });
      const actions = createElement("div", {
        className: "record-card__actions",
        attributes: { "aria-label": `Acciones de ${application.title}` }
      });
      const editButton = createButton("Editar", "edit", { id: application.id });
      const deleteButton = createButton("Eliminar", "delete", {
        id: application.id,
        variant: "danger"
      });

      appendChildren(metadata, candidate, likes, views);
      appendChildren(actions, editButton, deleteButton);
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
    services.feedback.loading(editingId ? "Actualizando postulación." : "Creando postulación.");

    try {
      if (editingId) {
        const response = await services.api.patch(`/posts/${editingId}`, data);

        if (!isActive) {
          return;
        }

        applications = applications.map((application) => application.id === editingId
          ? normalizeApplication({ ...application, ...response, ...data, id: editingId })
          : application);
        services.feedback.success("La postulación fue actualizada mediante PATCH.");
      } else {
        const response = await services.api.post("/posts/add", data);

        if (!isActive) {
          return;
        }

        const fallbackId = applications.reduce((highest, application) => Math.max(highest, application.id), 0) + 1;
        applications = [
          normalizeApplication({ ...response, ...data, id: Number(response?.id) || fallbackId }),
          ...applications
        ];
        services.feedback.success("La postulación fue creada y añadida al estado local.");
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

    const applicationId = Number(button.dataset.id);
    const application = applications.find((item) => item.id === applicationId);

    if (!application) {
      services.feedback.error("No se encontró la postulación seleccionada.");
      return;
    }

    if (button.dataset.action === "edit") {
      editingId = application.id;
      titleField.control.value = application.title;
      bodyField.control.value = application.body;
      userIdField.control.value = String(application.userId);
      formTitle.textContent = `Editar: ${application.title}`;
      submitButton.textContent = "Guardar cambios";
      cancelButton.classList.remove("is-hidden");
      titleField.control.focus();
      return;
    }

    if (button.dataset.action === "delete") {
      const confirmed = await services.feedback.confirmDelete(`¿Eliminar la postulación “${application.title}”?`);

      if (!confirmed || !isActive) {
        return;
      }

      setBusy(true);
      services.feedback.loading("Eliminando postulación.");

      try {
        await services.api.remove(`/posts/${application.id}`);

        if (!isActive) {
          return;
        }

        applications = applications.filter((item) => item.id !== application.id);

        if (editingId === application.id) {
          resetForm();
        }

        renderList();
        services.feedback.success("La postulación fue eliminada del estado local.");
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

  services.feedback.loading("Cargando postulaciones.");

  try {
    const response = await services.api.get("/posts?limit=12&select=id,title,body,userId,reactions,views");

    if (!isActive) {
      return;
    }

    applications = Array.isArray(response?.posts)
      ? response.posts.map(normalizeApplication)
      : [];
    renderList();
    services.feedback.clear();
  } catch (error) {
    if (isActive) {
      applications = [];
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
