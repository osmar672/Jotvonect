import { createDeleteConfirmation } from "./delete-confirmation.js";
import { appendChildren, createElement } from "./dom-utils.js";

export function createFeedbackService(root) {
  if (!(root instanceof HTMLElement)) {
    throw new TypeError("El servicio de feedback requiere #feedback-root.");
  }

  root.setAttribute("aria-live", "polite");
  root.setAttribute("aria-atomic", "true");

  const confirmation = createDeleteConfirmation(root);
  let clearTimer = null;

  const clearTimerIfNeeded = () => {
    if (clearTimer) {
      window.clearTimeout(clearTimer);
      clearTimer = null;
    }
  };

  const clear = () => {
    clearTimerIfNeeded();
    confirmation.cancel();
    root.replaceChildren();
  };

  const showMessage = (type, message, autoClear = false) => {
    clear();

    const panel = createElement("div", {
      className: `feedback-message feedback-message--${type}`,
      attributes: { role: type === "error" ? "alert" : "status" }
    });
    const indicator = createElement("span", {
      className: "feedback-message__indicator",
      attributes: { "aria-hidden": "true" }
    });
    const text = createElement("p", {
      className: "feedback-message__text",
      text: message || "Procesando solicitud."
    });
    const closeButton = createElement("button", {
      className: "feedback-message__close",
      text: "Cerrar",
      attributes: {
        type: "button",
        "aria-label": "Cerrar mensaje"
      }
    });

    closeButton.addEventListener("click", clear);
    appendChildren(panel, indicator, text, closeButton);
    root.replaceChildren(panel);

    if (autoClear) {
      clearTimer = window.setTimeout(clear, 4500);
    }
  };

  return Object.freeze({
    loading: (message) => showMessage("loading", message || "Cargando información."),
    success: (message) => showMessage("success", message || "Operación completada.", true),
    error: (message) => showMessage("error", message || "No fue posible completar la operación."),
    clear,
    confirmDelete: async (message) => {
      clearTimerIfNeeded();
      root.replaceChildren();
      return confirmation.confirmDelete(message);
    }
  });
}
