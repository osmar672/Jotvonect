import { getCurrentUser, getToken, logout, requireAuth } from "./auth/auth-service.js";
import { createApiClient } from "./core/api-client.js";
import { createFeedbackService } from "./core/feedback-service.js";
import { createInterfaceMotion } from "./animations/interface-motion.js";
import * as applications from "./modules/applications/index.js";
import * as candidates from "./modules/candidates/index.js";
import * as companies from "./modules/companies/index.js";
import * as home from "./modules/home/index.js";
import * as interviews from "./modules/interviews/index.js";
import * as tasks from "./modules/tasks/index.js";
import * as vacancies from "./modules/vacancies/index.js";
import { createProfileService } from "./profile/profile-service.js";
import { renderShell } from "./ui/shell.js";
import { createThemeController } from "./ui/theme-controller.js";

const modules = Object.freeze([
  home,
  candidates,
  vacancies,
  companies,
  applications,
  interviews,
  tasks
]);

function findModule(moduleId) {
  return modules.find(module => module.moduleMeta.id === moduleId) || null;
}

async function bootstrap() {
  if (!requireAuth()) return;

  const root = document.querySelector("#app");
  const feedback = createFeedbackService();
  const api = createApiClient({ getToken });
  const profileService = createProfileService(getCurrentUser());
  const themeController = createThemeController();
  const interfaceMotion = createInterfaceMotion(root);
  let services = null;
  let currentModule = null;
  let navigationVersion = 0;
  let shell = null;

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

  services = Object.freeze({ api, feedback, navigate: selectModule, profile: profileService, interfaceMotion });

  shell = renderShell({
    root,
    modules,
    onSelect: selectModule,
    profileService,
    interfaceMotion,
    themeController,
    onProfileSaved: () => feedback.success("Perfil y preferencias actualizados."),
    onLogout: () => {
      currentModule?.unmount();
      interfaceMotion.destroy();
      logout();
      window.location.replace("login.html");
    }
  });

  shell.setUser(profileService.get());

  window.addEventListener("unhandledrejection", event => {
    event.preventDefault();
    feedback.error(event.reason?.message || "Ocurrió un error inesperado.");
  });

  await selectModule(modules[0].moduleMeta.id);
}

bootstrap().catch(error => {
  const root = document.querySelector("#app");
  if (!root) return;

  const message = document.createElement("div");
  message.className = "startup-state startup-state--error";
  message.textContent = error.message || "No se pudo iniciar JobConnect.";
  root.replaceChildren(message);
});
