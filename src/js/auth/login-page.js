<<<<<<< Updated upstream
import { login, isAuthenticated } from "./auth-service.js";
if (isAuthenticated()) window.location.replace("index.html");
const root = document.querySelector("#login-root");
root.innerHTML = `<section class="auth-card" aria-labelledby="login-title">
  <div class="auth-brand">JC</div><p class="eyebrow">GESTIÓN DE EMPLEABILIDAD</p>
  <h1 id="login-title">Bienvenido a JobConnect</h1><p class="auth-copy">Inicia sesión para gestionar candidatos, vacantes y postulaciones.</p>
  <form id="login-form" novalidate>
    <label for="username">Usuario</label><input id="username" name="username" autocomplete="username" required>
    <small id="username-error" class="field-error"></small>
    <label for="password">Contraseña</label><input id="password" name="password" type="password" autocomplete="current-password" required>
    <small id="password-error" class="field-error"></small>
    <button id="submit-login" type="submit">Iniciar sesión</button>
    <p id="login-status" class="login-status" role="status" aria-live="polite"></p>
  </form>
  <p class="auth-hint">API de prueba: DummyJSON. Usa una cuenta de prueba válida de su documentación.</p>
</section>`;
const form=root.querySelector("#login-form"), button=root.querySelector("#submit-login"), status=root.querySelector("#login-status");
form.addEventListener("submit", async e => {
  e.preventDefault(); status.textContent=""; root.querySelectorAll(".field-error").forEach(x=>x.textContent="");
  const username=form.username.value.trim(), password=form.password.value;
  let valid=true;
  if(!username){root.querySelector("#username-error").textContent="El usuario es obligatorio.";valid=false;}
  if(!password){root.querySelector("#password-error").textContent="La contraseña es obligatoria.";valid=false;}
  if(!valid)return;
  button.disabled=true; button.textContent="Iniciando sesión…";
  try { await login(username,password); window.location.replace("index.html"); }
  catch(error){status.textContent=error.message||"No se pudo iniciar sesión."; status.className="login-status is-error";}
  finally {button.disabled=false;button.textContent="Iniciar sesión";}
});
=======
import { isAuthenticated, login } from './auth-service.js';
import {
  authenticateWithFace,
  enrollFace,
  hasFaceCredential,
  prepareFaceEngine,
  startFaceCamera,
  stopFaceCamera
} from './face-auth.js';
import {
  authenticateWithVoice,
  enrollVoice,
  hasVoiceCredential,
  prepareVoiceEngine,
  recordVoiceSample
} from './voice-auth.js';

export const DEMO_CREDENTIALS_BY_ROLE = Object.freeze({
  'job-seeker': Object.freeze({ username: 'emilys', password: 'emilyspass' }),
  employer: Object.freeze({ username: 'emilys', password: 'emilyspass' }),
  admin: Object.freeze({ username: 'emilys', password: 'emilyspass' })
});

if (isAuthenticated()) {
  window.location.replace('index.html');
} else {
  const form = document.querySelector('#login-form');
  const usernameInput = document.querySelector('#username');
  const passwordInput = document.querySelector('#password');
  const submitButton = document.querySelector('#submit-login');
  const demoButton = document.querySelector('#fill-demo');
  const faceLoginButton = document.querySelector('#face-login');
  const voiceLoginButton = document.querySelector('#voice-login');
  const rememberFace = document.querySelector('#remember-face');
  const rememberVoice = document.querySelector('#remember-voice');
  const status = document.querySelector('#login-status');
  const modal = document.querySelector('#face-modal');
  const video = document.querySelector('#face-video');
  const faceStatus = document.querySelector('#face-status');
  const faceCapture = document.querySelector('#face-capture');
  const voiceModal = document.querySelector('#voice-modal');
  const voiceStatus = document.querySelector('#voice-status');
  const voiceCapture = document.querySelector('#voice-capture');
  let cameraStream = null;
  let faceMode = 'authenticate';
  let resolveEnrollment = null;
  let rejectEnrollment = null;
  let voiceMode = 'authenticate';
  let resolveVoiceEnrollment = null;
  let rejectVoiceEnrollment = null;

  const getSelectedRole = () => form.querySelector("[name='accountType']:checked")?.value || 'job-seeker';

  function fillCredentialsForSelectedRole({ focusPassword = false } = {}) {
    const credentials = DEMO_CREDENTIALS_BY_ROLE[getSelectedRole()] || DEMO_CREDENTIALS_BY_ROLE['job-seeker'];
    usernameInput.value = credentials.username;
    passwordInput.value = credentials.password;
    clearMessages();
    status.textContent = 'Datos completados. Puedes iniciar sesión.';
    if (focusPassword) passwordInput.focus();
  }

  function clearMessages() {
    status.textContent = '';
    status.className = 'login-status';
    document.querySelector('#username-error').textContent = '';
    document.querySelector('#password-error').textContent = '';
  }

  function validate() {
    clearMessages();
    let valid = true;
    if (!usernameInput.value.trim()) {
      document.querySelector('#username-error').textContent = 'El usuario es obligatorio.';
      valid = false;
    }
    if (!passwordInput.value) {
      document.querySelector('#password-error').textContent = 'La contraseña es obligatoria.';
      valid = false;
    }
    return valid;
  }

  function setBusy(busy) {
    submitButton.disabled = busy;
    demoButton.disabled = busy;
    faceLoginButton.disabled = busy;
    voiceLoginButton.disabled = busy;
    submitButton.textContent = busy ? 'Iniciando sesión…' : 'Iniciar sesión';
    form.setAttribute('aria-busy', String(busy));
  }

  function openFaceModal(message = 'Estamos preparando el reconocimiento facial…') {
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    faceStatus.textContent = message;
    faceCapture.disabled = true;
  }

  function closeFaceModal() {
    if (faceMode === 'enroll' && rejectEnrollment) {
      rejectEnrollment(new Error('Registro facial cancelado.'));
      resolveEnrollment = null;
      rejectEnrollment = null;
    }
    faceMode = 'authenticate';
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    stopFaceCamera(cameraStream);
    cameraStream = null;
    faceCapture.disabled = false;
  }

  async function prepareCamera() {
    openFaceModal();
    try {
      faceStatus.textContent = 'Cargando reconocimiento facial…';
      await prepareFaceEngine();
      cameraStream = await startFaceCamera(video);
      faceStatus.textContent = 'Cámara lista. Centra tu rostro y pulsa “Reconocer rostro”.';
      faceCapture.disabled = false;
    } catch (error) {
      faceStatus.textContent = error.message || 'No se pudo preparar la cámara.';
      faceCapture.disabled = true;
    }
  }

  function openVoiceModal(message = 'Estamos preparando el reconocimiento de voz…') {
    voiceModal.hidden = false;
    voiceModal.setAttribute('aria-hidden', 'false');
    voiceStatus.textContent = message;
    voiceCapture.disabled = true;
    voiceMode = 'authenticate';
  }

  function closeVoiceModal() {
    voiceModal.hidden = true;
    voiceModal.setAttribute('aria-hidden', 'true');
    voiceCapture.disabled = false;
  }

  async function prepareVoiceAccess() {
    openVoiceModal();
    try {
      voiceStatus.textContent = 'Cargando el modelo de reconocimiento de voz…';
      await prepareVoiceEngine();
      voiceStatus.textContent = 'Listo. Pulsa “Comenzar grabación” y di la frase indicada.';
      voiceCapture.disabled = false;
    } catch (error) {
      voiceStatus.textContent = error.message || 'No se pudo preparar el reconocimiento de voz.';
    }
  }

  for (const closeButton of voiceModal.querySelectorAll('[data-voice-close]')) {
    closeButton.addEventListener('click', closeVoiceModal);
  }

  voiceLoginButton.addEventListener('click', async () => {
    if (!hasVoiceCredential()) {
      status.textContent = 'Primero inicia sesión con contraseña y registra tu voz.';
      status.className = 'login-status is-error';
      return;
    }
    await prepareVoiceAccess();
  });

  voiceCapture.addEventListener('click', async () => {
    voiceCapture.disabled = true;
    try {
      voiceStatus.textContent = 'Grabando… di “Mi voz es mi contraseña”.';
      const blob = await recordVoiceSample({
        durationMs: 4500,
        onProgress: percent => { voiceStatus.textContent = `Grabando… ${percent}%`; }
      });
      voiceStatus.textContent = 'Analizando tu voz…';
      if (voiceMode === 'enroll') {
        await enrollVoice({ username: usernameInput.value, password: passwordInput.value, accountType: getSelectedRole(), blob });
        voiceStatus.textContent = 'Voz registrada correctamente.';
        resolveVoiceEnrollment?.();
        resolveVoiceEnrollment = null;
        rejectVoiceEnrollment = null;
        closeVoiceModal();
        return;
      }
      const credentials = await authenticateWithVoice(blob);
      await login(credentials.username, credentials.password, globalThis.fetch, credentials.accountType);
      voiceStatus.textContent = 'Voz reconocida. Abriendo JobConnect…';
      window.setTimeout(() => window.location.replace('index.html'), 350);
    } catch (error) {
      voiceStatus.textContent = error.message || 'No se pudo validar la voz.';
      voiceCapture.disabled = false;
    }
  });

  demoButton.addEventListener('click', () => fillCredentialsForSelectedRole({ focusPassword: true }));

  for (const roleInput of form.querySelectorAll("[name='accountType']")) {
    roleInput.addEventListener('click', () => fillCredentialsForSelectedRole());
  }

  for (const closeButton of modal.querySelectorAll('[data-face-close]')) {
    closeButton.addEventListener('click', closeFaceModal);
  }

  faceLoginButton.addEventListener('click', async () => {
    if (!hasFaceCredential()) {
      status.textContent = 'Primero inicia sesión con contraseña y marca “Activar acceso con mi cara”.';
      status.className = 'login-status is-error';
      return;
    }
    await prepareCamera();
  });

  faceCapture.addEventListener('click', async () => {
    faceCapture.disabled = true;
    faceStatus.textContent = 'Analizando rostro…';

    if (faceMode === 'enroll') {
      try {
        await enrollFace({ video, username: usernameInput.value, password: passwordInput.value, accountType: getSelectedRole() });
        faceStatus.textContent = 'Rostro registrado correctamente.';
        resolveEnrollment?.();
        resolveEnrollment = null;
        rejectEnrollment = null;
      } catch (error) {
        faceStatus.textContent = error.message || 'No se pudo registrar el rostro.';
        faceCapture.disabled = false;
        rejectEnrollment?.(error);
        resolveEnrollment = null;
        rejectEnrollment = null;
      }
      return;
    }

    try {
      const credentials = await authenticateWithFace(video);
      await login(credentials.username, credentials.password, globalThis.fetch, credentials.accountType);
      faceStatus.textContent = 'Rostro reconocido. Abriendo JobConnect…';
      window.setTimeout(() => window.location.replace('index.html'), 350);
    } catch (error) {
      faceStatus.textContent = error.message || 'No se pudo validar el rostro.';
      faceCapture.disabled = false;
    }
  });

  fillCredentialsForSelectedRole();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!validate()) return;

    setBusy(true);
    status.textContent = 'Validando credenciales…';

    try {
      const accountType = getSelectedRole();
      await login(usernameInput.value, passwordInput.value, globalThis.fetch, accountType);

      if (rememberFace.checked) {
        try {
          openFaceModal('Autenticación correcta. Ahora registra tu rostro para futuros accesos.');
          cameraStream = await startFaceCamera(video);
          faceStatus.textContent = 'Mira al centro de la cámara y pulsa “Reconocer rostro” para guardar tu acceso facial.';
          faceCapture.disabled = false;
          await new Promise((resolve, reject) => {
            const handler = async () => {
              faceCapture.disabled = true;
              try {
                await enrollFace({ video, username: usernameInput.value, password: passwordInput.value, accountType });
                faceStatus.textContent = 'Rostro registrado correctamente.';
                resolve();
              } catch (error) {
                faceCapture.disabled = false;
                reject(error);
              }
            };
            faceCapture.onclick = handler;
          });
          faceCapture.onclick = null;
          closeFaceModal();
        } catch (error) {
          closeFaceModal();
          status.textContent = `Sesión iniciada, pero no se configuró el acceso facial: ${error.message}`;
          status.className = 'login-status is-error';
          setBusy(false);
          window.setTimeout(() => window.location.replace('index.html'), 1200);
          return;
        }
      }

      if (rememberVoice.checked) {
        try {
          openVoiceModal('Autenticación correcta. Registra tu voz para futuros accesos.');
          voiceMode = 'enroll';
          await prepareVoiceEngine();
          voiceStatus.textContent = 'Pulsa “Comenzar grabación” y di “Mi voz es mi contraseña”.';
          voiceCapture.disabled = false;
          await new Promise((resolve, reject) => {
            resolveVoiceEnrollment = resolve;
            rejectVoiceEnrollment = reject;
          });
        } catch (error) {
          closeVoiceModal();
          status.textContent = `Sesión iniciada, pero no se configuró el acceso por voz: ${error.message}`;
          status.className = 'login-status is-error';
          setBusy(false);
          window.setTimeout(() => window.location.replace('index.html'), 1200);
          return;
        }
      }

      status.textContent = 'Sesión iniciada. Abriendo el panel…';
      status.className = 'login-status is-success';
      window.location.replace('index.html');
    } catch (error) {
      status.textContent = error.message || 'No se pudo iniciar sesión.';
      status.className = 'login-status is-error';
      setBusy(false);
    }
  });
}
>>>>>>> Stashed changes
