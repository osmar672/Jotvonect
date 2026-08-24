import { appendChildren, createElement } from "./dom-utils.js";

export function createDeleteConfirmation(root) {
  let cancelActiveConfirmation = null;

  const confirmDelete = (message) => {
    if (cancelActiveConfirmation) {
      cancelActiveConfirmation();
    }

    return new Promise((resolve) => {
      const previousFocus = document.activeElement;
      const panel = createElement("section", {
        className: "delete-confirmation",
        attributes: {
          role: "alertdialog",
          "aria-labelledby": "delete-confirmation-title",
          "aria-describedby": "delete-confirmation-message"
        }
      });
      const title = createElement("h2", {
        className: "delete-confirmation__title",
        text: "Confirmar eliminación",
        attributes: { id: "delete-confirmation-title" }
      });
      const description = createElement("p", {
        className: "delete-confirmation__message",
        text: message || "¿Deseas eliminar este registro?",
        attributes: { id: "delete-confirmation-message" }
      });
      const actions = createElement("div", { className: "delete-confirmation__actions" });
      const cancelButton = createElement("button", {
        className: "button button--secondary",
        text: "Cancelar",
        attributes: { type: "button" }
      });
      const confirmButton = createElement("button", {
        className: "button button--danger",
        text: "Eliminar",
        attributes: { type: "button" }
      });

      let settled = false;

      const finish = (decision) => {
        if (settled) {
          return;
        }

        settled = true;
        document.removeEventListener("keydown", handleKeydown);
        root.replaceChildren();
        cancelActiveConfirmation = null;

        if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
          previousFocus.focus();
        }

        resolve(decision);
      };

      const handleKeydown = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          finish(false);
          return;
        }

        if (event.key !== "Tab") {
          return;
        }

        const focusable = [cancelButton, confirmButton];
        const currentIndex = focusable.indexOf(document.activeElement);
        const direction = event.shiftKey ? -1 : 1;
        const nextIndex = currentIndex < 0
          ? 0
          : (currentIndex + direction + focusable.length) % focusable.length;

        event.preventDefault();
        focusable[nextIndex].focus();
      };

      cancelButton.addEventListener("click", () => finish(false));
      confirmButton.addEventListener("click", () => finish(true));
      document.addEventListener("keydown", handleKeydown);
      cancelActiveConfirmation = () => finish(false);

      appendChildren(actions, cancelButton, confirmButton);
      appendChildren(panel, title, description, actions);
      root.replaceChildren(panel);
      queueMicrotask(() => cancelButton.focus());
    });
  };

  return {
    confirmDelete,
    cancel: () => {
      if (cancelActiveConfirmation) {
        cancelActiveConfirmation();
      }
    }
  };
}
