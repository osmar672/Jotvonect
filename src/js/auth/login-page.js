import { isAuthenticated, login } from "./auth-service.js";

if (isAuthenticated()) {
  window.location.replace("index.html");
} else {
  const form = document.querySelector("#login-form");
  const usernameInput = document.querySelector("#username");
  const passwordInput = document.querySelector("#password");
  const submitButton = document.querySelector("#submit-login");
  const demoButton = document.querySelector("#fill-demo");
  const status = document.querySelector("#login-status");

  function clearMessages() {
    status.textContent = "";
    status.className = "login-status";
    document.querySelector("#username-error").textContent = "";
    document.querySelector("#password-error").textContent = "";
  }

  function validate() {
    clearMessages();
    let valid = true;

    if (!usernameInput.value.trim()) {
      document.querySelector("#username-error").textContent = "El usuario es obligatorio.";
      valid = false;
    }

    if (!passwordInput.value) {
      document.querySelector("#password-error").textContent = "La contraseña es obligatoria.";
      valid = false;
    }

    return valid;
  }

  function setBusy(busy) {
    submitButton.disabled = busy;
    demoButton.disabled = busy;
    submitButton.textContent = busy ? "Iniciando sesión…" : "Iniciar sesión";
    form.setAttribute("aria-busy", String(busy));
  }

  demoButton.addEventListener("click", () => {
    usernameInput.value = "emilys";
    passwordInput.value = "emilyspass";
    clearMessages();
    usernameInput.focus();
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!validate()) return;

    setBusy(true);
    status.textContent = "Validando credenciales…";

    try {
      await login(usernameInput.value, passwordInput.value);
      status.textContent = "Sesión iniciada. Abriendo el panel…";
      status.className = "login-status is-success";
      window.location.replace("index.html");
    } catch (error) {
      status.textContent = error.message || "No se pudo iniciar sesión.";
      status.className = "login-status is-error";
      setBusy(false);
    }
  });
}
