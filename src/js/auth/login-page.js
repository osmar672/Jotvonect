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