import { requireAuth, getCurrentUser, logout, getToken } from "./auth/auth-service.js";
import { createApiClient } from "./core/api-client.js";
import { createFeedbackService } from "./core/feedback-service.js";
import { renderShell } from "./ui/shell.js";
import * as candidates from "./modules/candidates/index.js";
import * as vacancies from "./modules/vacancies/index.js";
import * as companies from "./modules/companies/index.js";
import * as applications from "./modules/applications/index.js";
import * as interviews from "./modules/interviews/index.js";
import * as tasks from "./modules/tasks/index.js";

<<<<<<< Updated upstream
if (requireAuth()) {
  const modules=[candidates,vacancies,companies,applications,interviews,tasks];
  const api=createApiClient({getToken});
  const feedback=createFeedbackService();
  const services={api,feedback,auth:{getToken, isAuthenticated:()=>true, logout}};
  const root=document.querySelector("#app");
  let current=null;
  const {contentContainer}=renderShell({
    root, modules,
    onSelect: async id => {
      const next=modules.find(m=>m.moduleMeta.id===id); if(!next)return;
      try { current?.unmount(); current=next; await next.mount(contentContainer,services); contentContainer.focus(); root.querySelectorAll("[data-module]").forEach(b=>b.classList.toggle("is-active",b.dataset.module===id)); }
      catch(error){feedback.error(error.message||"No se pudo cargar el módulo.");}
    },
    onLogout:()=>{logout();window.location.replace("login.html");}
=======
const allModules = Object.freeze([
  dashboard,
  home,
  candidates,
  vacancies,
  companies,
  applications,
  interviews,
  tasks,
  resumes
]);

let modules = allModules;

function findModule(moduleId) {
  return modules.find(module => module.moduleMeta.id === moduleId) || null;
}

async function bootstrap() {
  const loaderElement = document.querySelector("#pixel-swap-loader");

  // Nunca permitas que la pantalla de carga bloquee el acceso al login.
  // Al entrar directamente a index.html sin sesión, ocultamos el loader antes
  // de redirigir a login.html. Esto evita que el splash quede encima durante
  // la navegación o cuando el navegador conserva la página en caché.
  if (!requireAuth()) {
    loaderElement?.classList.add("is-complete");
    loaderElement?.setAttribute("aria-hidden", "true");
    return;
  }

  const earlyPreferences = applyEarlyPreferences();

  const root = document.querySelector("#app");
  const loader = createPixelSwapLoader(loaderElement);
  const splashCursor = earlyPreferences.lowPerformance ? () => {} : createSplashCursor({
    DENSITY_DISSIPATION: 3.5,
    VELOCITY_DISSIPATION: 2,
    PRESSURE: 0.1,
    CURL: 3,
    SPLAT_RADIUS: 0.2,
    SPLAT_FORCE: 6000,
    COLOR_UPDATE_SPEED: 10,
    SHADING: true,
    RAINBOW_MODE: false,
    COLOR: "#AFDDFF"
>>>>>>> Stashed changes
  });
  const user=getCurrentUser(); root.querySelector("[data-user]").textContent=`${user?.firstName||user?.username||"Usuario"} ${user?.lastName||""}`.trim();
  root.querySelector("[data-module]")?.click();
}