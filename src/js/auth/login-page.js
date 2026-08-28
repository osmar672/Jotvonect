import { isAuthenticated, login } from "./auth-service.js";
import { applyStandaloneTranslation } from "../ui/preferences-controller.js";

if (globalThis.document?.body) applyStandaloneTranslation(document.body);

export const DEMO_CREDENTIALS_BY_ROLE = Object.freeze({
  "job-seeker": Object.freeze({ username: "emilys", password: "emilyspass" }),
  employer: Object.freeze({ username: "emilys", password: "emilyspass" }),
  admin: Object.freeze({ username: "emilys", password: "emilyspass" })
});

if (isAuthenticated()) {
  window.location.replace("index.html");
} else {
  const form = document.querySelector("#login-form");
  const usernameInput = document.querySelector("#username");
  const passwordInput = document.querySelector("#password");
  const submitButton = document.querySelector("#submit-login");
  const demoButton = document.querySelector("#fill-demo");
  const status = document.querySelector("#login-status");
  const faceCard = document.querySelector("#reflective-face-card");
  const faceVideo = document.querySelector("#face-video");
  const faceStatus = document.querySelector("#face-login-status");
  const faceRoleLabel = document.querySelector("#face-role-label");
  const openFaceButton = document.querySelector("#open-face-login");
  const verifyFaceButton = document.querySelector("#verify-face-login");
  const cancelFaceButton = document.querySelector("#cancel-face-login");
  let faceStream = null;

  const getSelectedRole = () => form.querySelector("[name='accountType']:checked")?.value || "job-seeker";

  function fillCredentialsForSelectedRole({ focusPassword = false } = {}) {
    const credentials = DEMO_CREDENTIALS_BY_ROLE[getSelectedRole()] || DEMO_CREDENTIALS_BY_ROLE["job-seeker"];
    usernameInput.value = credentials.username;
    passwordInput.value = credentials.password;
    clearMessages();
    status.textContent = "Datos completados. Puedes iniciar sesión.";
    if (focusPassword) passwordInput.focus();
  }

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

  function stopFaceCamera() {
    faceStream?.getTracks?.().forEach(track => track.stop());
    faceStream = null;
    if (faceVideo) faceVideo.srcObject = null;
  }

  async function startFaceCamera() {
    if (!faceCard || !faceVideo || !faceStatus) return;
    faceCard.hidden = false;
    faceStatus.className = "face-access__status";
    faceStatus.textContent = "Solicitando acceso a la cámara…";
    faceRoleLabel.textContent = form.querySelector("[name='accountType']:checked")?.parentElement?.innerText?.split("\n")?.[0] || getSelectedRole();
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Este navegador no permite usar la cámara.");
      faceStream = await navigator.mediaDevices.getUserMedia({ video:{ width:{ ideal:640 }, height:{ ideal:480 }, facingMode:"user" }, audio:false });
      faceVideo.srcObject = faceStream;
      await faceVideo.play();
      faceStatus.textContent = "Cámara activa. Centra tu rostro y pulsa Verificar rostro.";
      verifyFaceButton?.focus();
    } catch (error) {
      stopFaceCamera();
      faceStatus.textContent = error.name === "NotAllowedError" ? "Permiso de cámara rechazado. Habilítalo en la configuración del navegador." : error.message;
      faceStatus.className = "face-access__status is-error";
    }
  }

  async function hasVisibleFace() {
    if (!faceVideo || faceVideo.readyState < 2) return false;
    if (typeof globalThis.FaceDetector === "function") {
      const detector = new globalThis.FaceDetector({ fastMode:true, maxDetectedFaces:1 });
      return (await detector.detect(faceVideo)).length > 0;
    }
    return true;
  }

  async function verifyFaceAccess() {
    if (!faceStream || !faceStatus || !verifyFaceButton) return;
    verifyFaceButton.disabled = true;
    faceStatus.textContent = "Comprobando presencia facial…";
    try {
      if (!(await hasVisibleFace())) throw new Error("No se detectó un rostro. Mejora la iluminación y vuelve a intentarlo.");
      const credentials = DEMO_CREDENTIALS_BY_ROLE[getSelectedRole()] || DEMO_CREDENTIALS_BY_ROLE["job-seeker"];
      faceStatus.textContent = "Rostro detectado. Abriendo JobConnect…";
      faceStatus.className = "face-access__status is-success";
      await login(credentials.username, credentials.password, globalThis.fetch, getSelectedRole());
      stopFaceCamera();
      window.location.replace("index.html");
    } catch (error) {
      faceStatus.textContent = error.message || "No se pudo completar el acceso facial.";
      faceStatus.className = "face-access__status is-error";
      verifyFaceButton.disabled = false;
    }
  }

  demoButton.addEventListener("click", () => {
    fillCredentialsForSelectedRole({ focusPassword: true });
  });

  for (const roleInput of form.querySelectorAll("[name='accountType']")) {
    roleInput.addEventListener("click", () => { fillCredentialsForSelectedRole(); if (faceRoleLabel) faceRoleLabel.textContent = roleInput.parentElement?.innerText?.split("\n")?.[0] || roleInput.value; });
  }

  openFaceButton?.addEventListener("click", startFaceCamera);
  verifyFaceButton?.addEventListener("click", verifyFaceAccess);
  cancelFaceButton?.addEventListener("click", () => { stopFaceCamera(); faceCard.hidden = true; openFaceButton?.focus(); });
  globalThis.addEventListener?.("pagehide", stopFaceCamera, { once:true });

  fillCredentialsForSelectedRole();

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!validate()) return;

    setBusy(true);
    status.textContent = "Validando credenciales…";

    try {
      await login(usernameInput.value, passwordInput.value, globalThis.fetch, getSelectedRole());
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
