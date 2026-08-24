export function createFeedbackService(root = document.querySelector("#feedback-root")) {
  const render = (type, message, action = "") => {
    if (!root) return;
    root.innerHTML = `<div class="feedback feedback--${type}" role="${type === "error" ? "alert" : "status"}">
      <span>${escapeHtml(message)}</span>${action}</div>`;
  };
  return {
    loading: message => render("loading", message),
    success: message => render("success", message),
    error: message => render("error", message),
    clear: () => { if (root) root.replaceChildren(); },
    confirmDelete: message => Promise.resolve(window.confirm(message))
  };
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}