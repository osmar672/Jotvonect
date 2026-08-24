import { integrationConfig } from "./config/integration-config.js";
import { createApiClient } from "./core/api-client.js";
import { createElement } from "./core/dom-utils.js";
import { normalizeError } from "./core/error-normalizer.js";
import { createFeedbackService } from "./core/feedback-service.js";
import { renderShell } from "./ui/shell.js";
import * as vacanciesModule from "./modules/vacancies/vacancies.js";
import * as companiesModule from "./modules/companies/companies.js";
import * as applicationsModule from "./modules/applications/applications.js";

const appRoot = document.getElementById("app");
const feedbackRoot = document.getElementById("feedback-root");

function validateModule(module, expectedId) {
  const isValid = module?.moduleMeta?.id === expectedId
    && typeof module.moduleMeta.label === "string"
    && typeof module.mount === "function"
    && typeof module.unmount === "function";

  if (!isValid) {
    throw new TypeError(`El módulo ${expectedId} no cumple el contrato compartido.`);
  }

  return module;
}

function validateAuthService(authService) {
  const requiredMethods = [
    "login",
    "getToken",
    "getCurrentUser",
    "isAuthenticated",
    "requireAuth",
    "logout"
  ];

  if (!authService || !requiredMethods.every((method) => typeof authService[method] === "function")) {
    throw new TypeError("El servicio de autenticación no cumple el contrato compartido.");
  }

  return authService;
}

async function loadIntegrantOne() {
  if (!integrationConfig.integrantOneReady) {
    return {
      authService: null,
      modules: {},
      status: "Pendiente de merge: autenticación, Candidatos, Entrevistas y Tareas."
    };
  }

  const [authService, candidates, interviews, tasks] = await Promise.all([
    import(integrationConfig.authPath),
    import(integrationConfig.modulePaths.candidates),
    import(integrationConfig.modulePaths.interviews),
    import(integrationConfig.modulePaths.tasks)
  ]);

  return {
    authService: validateAuthService(authService),
    modules: {
      candidates: validateModule(candidates, "candidates"),
      interviews: validateModule(interviews, "interviews"),
      tasks: validateModule(tasks, "tasks")
    },
    status: ""
  };
}

function getCurrentUserLabel(authService) {
  if (!authService) {
    return "Integración de sesión pendiente";
  }

  const currentUser = authService.getCurrentUser();

  if (!currentUser) {
    return "Usuario autenticado";
  }

  if (typeof currentUser === "string") {
    return currentUser;
  }

  const fullName = [currentUser.firstName, currentUser.lastName]
    .filter((value) => typeof value === "string" && value.trim())
    .join(" ")
    .trim();

  return fullName || currentUser.username || currentUser.email || "Usuario autenticado";
}

function renderMountError(container, moduleLabel, message) {
  const errorState = createElement("section", {
    className: "empty-state",
    attributes: { role: "alert" }
  });
  const title = createElement("p", {
    className: "empty-state__title",
    text: `No se pudo abrir ${moduleLabel}`
  });
  const description = createElement("p", { text: message });

  description.style.marginBottom = "0";
  errorState.append(title, description);
  container.replaceChildren(errorState);
}

async function bootstrap() {
  if (!(appRoot instanceof HTMLElement) || !(feedbackRoot instanceof HTMLElement)) {
    throw new Error("No se encontraron los elementos raíz de JobConnect.");
  }

  const feedback = createFeedbackService(feedbackRoot);
  let integrantOne;

  try {
    integrantOne = await loadIntegrantOne();
  } catch (error) {
    const normalizedError = normalizeError(error, "No fue posible cargar la integración del Integrante 1.");
    integrantOne = {
      authService: null,
      modules: {},
      status: "La integración del Integrante 1 necesita revisión."
    };
    feedback.error(normalizedError.message);
  }

  const authService = integrantOne.authService;

  if (authService && !authService.requireAuth()) {
    return;
  }

  const authFacade = Object.freeze({
    getToken: () => authService?.getToken() || null,
    isAuthenticated: () => Boolean(authService?.isAuthenticated()),
    logout: () => authService?.logout()
  });
  const api = createApiClient({ getToken: authFacade.getToken });
  const services = Object.freeze({ api, feedback, auth: authFacade });

  const modules = [
    integrantOne.modules.candidates,
    validateModule(vacanciesModule, "vacancies"),
    validateModule(companiesModule, "companies"),
    validateModule(applicationsModule, "applications"),
    integrantOne.modules.interviews,
    integrantOne.modules.tasks
  ].filter(Boolean);
  const moduleRegistry = new Map(modules.map((module) => [module.moduleMeta.id, module]));

  appRoot.dataset.currentUser = getCurrentUserLabel(authService);
  appRoot.dataset.integrationStatus = integrantOne.status;

  let activeModule = null;
  let selectionVersion = 0;
  let contentContainer;

  const selectModule = async (moduleId) => {
    const selectedModule = moduleRegistry.get(moduleId);

    if (!selectedModule) {
      feedback.error("El módulo seleccionado todavía no está disponible.");
      return;
    }

    const currentVersion = ++selectionVersion;

    if (activeModule) {
      activeModule.unmount();
    }

    activeModule = selectedModule;
    contentContainer.replaceChildren();

    try {
      await selectedModule.mount(contentContainer, services);
    } catch (error) {
      if (currentVersion !== selectionVersion) {
        return;
      }

      const normalizedError = normalizeError(error, `No fue posible montar ${selectedModule.moduleMeta.label}.`);
      feedback.error(normalizedError.message);
      renderMountError(contentContainer, selectedModule.moduleMeta.label, normalizedError.message);
    }
  };

  const handleLogout = () => {
    if (!authService) {
      feedback.error("El logout se habilitará al fusionar la autenticación del Integrante 1.");
      return;
    }

    try {
      selectionVersion += 1;
      activeModule?.unmount();
      authFacade.logout();
      window.location.assign("./login.html");
    } catch (error) {
      feedback.error(normalizeError(error, "No fue posible cerrar la sesión.").message);
    }
  };

  ({ contentContainer } = renderShell({
    root: appRoot,
    modules,
    onSelect: selectModule,
    onLogout: handleLogout
  }));

  await selectModule(modules[0].moduleMeta.id);
}

bootstrap().catch((error) => {
  const normalizedError = normalizeError(error, "JobConnect no pudo iniciar.");

  if (feedbackRoot instanceof HTMLElement) {
    feedbackRoot.replaceChildren(createElement("p", {
      className: "feedback-message feedback-message--error",
      text: normalizedError.message,
      attributes: { role: "alert" }
    }));
  }
});
