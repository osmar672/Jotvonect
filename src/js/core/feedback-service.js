function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[character]));
}

export function createFeedbackService(
  root = globalThis.document?.querySelector("#feedback-root") ?? null,
  dialogRoot = globalThis.document?.querySelector("#dialog-root") ?? null
) {
  let clearTimer = null;
  let activeConfirmation = null;

  const ownerDocument = dialogRoot?.ownerDocument
    ?? root?.ownerDocument
    ?? globalThis.document
    ?? null;

  function clearTimerIfNeeded() {
    if (clearTimer) clearTimeout(clearTimer);
    clearTimer = null;
  }

  function clear() {
    clearTimerIfNeeded();
    root?.replaceChildren();
  }

  function render(type, message, autoClear = false) {
    if (!root) return;

    clearTimerIfNeeded();
    root.innerHTML = `<div class="feedback feedback--${type}" role="${type === "error" ? "alert" : "status"}">
      <span class="feedback__indicator" aria-hidden="true"></span>
      <span>${escapeHtml(message)}</span>
      <button type="button" class="feedback__close" aria-label="Cerrar mensaje">×</button>
    </div>`;

    root.querySelector(".feedback__close")?.addEventListener("click", clear, { once: true });

    if (autoClear) clearTimer = setTimeout(clear, 4500);
  }

  function ensureDialogRoot() {
    if (dialogRoot) return dialogRoot;
    if (!ownerDocument?.body || typeof ownerDocument.createElement !== "function") return null;

    dialogRoot = ownerDocument.createElement("div");
    dialogRoot.id = "dialog-root";
    ownerDocument.body.append(dialogRoot);
    return dialogRoot;
  }

  function closeConfirmation(result) {
    if (!activeConfirmation) return;

    const current = activeConfirmation;
    activeConfirmation = null;

    current.cancelButton.removeEventListener("click", current.onCancel);
    current.confirmButton.removeEventListener("click", current.onConfirm);
    current.backdrop.removeEventListener("click", current.onBackdropClick);
    current.document?.removeEventListener("keydown", current.onKeyDown);
    current.root.replaceChildren();
    current.document?.body?.classList.remove("has-dialog");

    if (current.pageRoot && !current.pageWasInert) {
      current.pageRoot.removeAttribute("inert");
    }

    current.previousFocus?.focus?.();
    current.resolve(Boolean(result));
  }

  function confirmDelete(message) {
    const currentRoot = ensureDialogRoot();
    if (!currentRoot) return Promise.resolve(false);

    closeConfirmation(false);

    return new Promise(resolve => {
      const currentDocument = currentRoot.ownerDocument ?? ownerDocument;
      const previousFocus = currentDocument?.activeElement ?? null;
      const pageRoot = currentDocument?.querySelector?.("#app") ?? null;
      const pageWasInert = pageRoot?.hasAttribute?.("inert") ?? false;

      currentRoot.innerHTML = `<div class="dialog-backdrop" data-confirm-backdrop>
        <section class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message">
          <div class="confirm-dialog__icon" aria-hidden="true">!</div>
          <div class="confirm-dialog__content">
            <p class="eyebrow">CONFIRMACIÓN</p>
            <h2 id="confirm-dialog-title">Eliminar registro</h2>
            <p id="confirm-dialog-message" class="confirm-dialog__message" data-confirm-message></p>
          </div>
          <div class="confirm-dialog__actions">
            <button type="button" class="btn" data-confirm-cancel>Cancelar</button>
            <button type="button" class="btn btn--danger-solid" data-confirm-accept>Sí, eliminar</button>
          </div>
        </section>
      </div>`;

      const backdrop = currentRoot.querySelector("[data-confirm-backdrop]");
      const messageNode = currentRoot.querySelector("[data-confirm-message]");
      const cancelButton = currentRoot.querySelector("[data-confirm-cancel]");
      const confirmButton = currentRoot.querySelector("[data-confirm-accept]");

      if (!backdrop || !messageNode || !cancelButton || !confirmButton) {
        currentRoot.replaceChildren();
        resolve(false);
        return;
      }

      messageNode.textContent = String(message);

      const onCancel = () => closeConfirmation(false);
      const onConfirm = () => closeConfirmation(true);
      const onBackdropClick = event => {
        if (event.target === backdrop) closeConfirmation(false);
      };
      const onKeyDown = event => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeConfirmation(false);
          return;
        }

        if (event.key !== "Tab") return;
        if (event.shiftKey && currentDocument.activeElement === cancelButton) {
          event.preventDefault();
          confirmButton.focus();
        } else if (!event.shiftKey && currentDocument.activeElement === confirmButton) {
          event.preventDefault();
          cancelButton.focus();
        }
      };

      activeConfirmation = {
        root: currentRoot,
        document: currentDocument,
        pageRoot,
        pageWasInert,
        previousFocus,
        backdrop,
        cancelButton,
        confirmButton,
        onCancel,
        onConfirm,
        onBackdropClick,
        onKeyDown,
        resolve
      };

      cancelButton.addEventListener("click", onCancel);
      confirmButton.addEventListener("click", onConfirm);
      backdrop.addEventListener("click", onBackdropClick);
      currentDocument?.addEventListener("keydown", onKeyDown);
      currentDocument?.body?.classList.add("has-dialog");
      pageRoot?.setAttribute?.("inert", "");
      cancelButton.focus();
    });
  }

  return Object.freeze({
    loading: message => render("loading", message),
    success: message => render("success", message, true),
    error: message => render("error", message),
    clear,
    confirmDelete
  });
}
