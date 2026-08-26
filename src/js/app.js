import { getCurrentUser, getToken, logout, requireAuth } from "./auth/auth-service.js";
import { createApiClient } from "./core/api-client.js";
import { createFeedbackService } from "./core/feedback-service.js";
import { createInterfaceMotion } from "./animations/interface-motion.js";
import { createPixelSwapLoader } from "./animations/pixel-swap.js";
import { createSplashCursor } from "./animations/splash-cursor.js";
import * as applications from "./modules/applications/index.js";
import * as dashboard from "./modules/dashboard/index.js";
import * as candidates from "./modules/candidates/index.js";
import * as companies from "./modules/companies/index.js";
import * as home from "./modules/home/index.js?v=lumen-1";
import * as interviews from "./modules/interviews/index.js";
import * as tasks from "./modules/tasks/index.js";
import * as vacancies from "./modules/vacancies/index.js";
import * as resumes from "./modules/resumes/index.js";
import { filterModulesForRole, normalizeRole } from "./auth/access-control.js";
import { createResumeService } from "./resumes/resume-service.js";
import { createProfileService } from "./profile/profile-service.js";
import { renderShell } from "./ui/shell.js";
import { createThemeController } from "./ui/theme-controller.js";
import { createAiAssistant } from "./ui/ai-assistant.js";
import { applyEarlyPreferences, createPreferencesController } from "./ui/preferences-controller.js";

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
  if (!requireAuth()) return;

  const earlyPreferences = applyEarlyPreferences();

  const root = document.querySelector("#app");
  const loader = createPixelSwapLoader(document.querySelector("#pixel-swap-loader"));
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
  });
  const feedback = createFeedbackService();
  const api = createApiClient({ getToken });
  const profileService = createProfileService(getCurrentUser());
  const role = normalizeRole(profileService.get().accountType);
  const resumeService = createResumeService(getCurrentUser());
  modules = filterModulesForRole(allModules, role);
  const themeController = createThemeController();
  const interfaceMotion = createInterfaceMotion(root);
  let services = null;
  let currentModule = null;
  let navigationVersion = 0;
  let shell = null;
  let destroyAssistant = () => {};
  let destroyPreferences = () => {};

 feature-yubran
 Updated upstream
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
 Stashed changes

  async function selectModule(moduleId) {
    const nextModule = findModule(moduleId);
    if (!nextModule) {
      feedback.error("El módulo seleccionado no existe.");
      return;
    }

    const version = ++navigationVersion;

    try {
      if (currentModule) await interfaceMotion.transitionOut(shell.contentContainer);
      if (version !== navigationVersion) return;

      currentModule?.unmount();
      currentModule = nextModule;
      shell.setActive(moduleId);
      const mountPromise = nextModule.mount(shell.contentContainer, services);
      await Promise.resolve();
      await interfaceMotion.transitionIn(shell.contentContainer);
      await mountPromise;

      if (version !== navigationVersion) return;
      shell.contentContainer.focus({ preventScroll: true });
    } catch (error) {
      if (version !== navigationVersion) return;

      feedback.error(error.message || "No se pudo cargar el módulo.");
      shell.contentContainer.innerHTML = `<div class="module-state is-error">No se pudo cargar este módulo.</div>`;
    }
  }

  services = Object.freeze({ api, feedback, navigate: selectModule, profile: profileService, resumes: resumeService, role, interfaceMotion });

  shell = renderShell({
    root,
    modules,
    onSelect: selectModule,
    profileService,
    interfaceMotion,
    themeController,
    onProfileSaved: () => { feedback.success("Perfil y preferencias actualizados."); window.setTimeout(() => window.location.reload(), 500); },
    onLogout: () => {
      currentModule?.unmount();
      interfaceMotion.destroy();
      splashCursor();
      destroyAssistant();
      destroyPreferences();
      logout();
      window.location.replace("login.html");
    }
 main
  });

  shell.setUser(profileService.get());
  destroyPreferences = createPreferencesController(root);
  destroyAssistant = createAiAssistant(root, { role });

  window.addEventListener("unhandledrejection", event => {
    event.preventDefault();
    feedback.error(event.reason?.message || "Ocurrió un error inesperado.");
  });

  await selectModule(modules[0].moduleMeta.id);
  await loader.play();
  loader.destroy();
}

bootstrap().catch(error => {
  const root = document.querySelector("#app");
  if (!root) return;

  const message = document.createElement("div");
  message.className = "startup-state startup-state--error";
  message.textContent = error.message || "No se pudo iniciar JobConnect.";
  root.replaceChildren(message);
});
