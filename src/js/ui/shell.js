import { getAccountTypeLabel } from "../profile/profile-service.js";
import { createProfilePanel, getProfileInitials } from "./profile-panel.js";

const MODULE_DESCRIPTIONS = Object.freeze({
  home: "Conoce JobConnect, sus estándares y la propuesta de valor.",
  candidates: "Consulta, registra y actualiza perfiles de talento.",
  vacancies: "Publica oportunidades y administra sus condiciones.",
  companies: "Organiza las empresas y sus necesidades de contratación.",
  applications: "Da seguimiento a candidaturas y procesos activos.",
  interviews: "Registra entrevistas, observaciones y notas de evaluación.",
  tasks: "Planifica pendientes y marca el trabajo completado."
});

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[character]));
}

function getModuleMetadata(module) {
  const metadata = module?.moduleMeta;

  if (!metadata?.id || !metadata?.label) {
    throw new Error("Un módulo no declaró moduleMeta.id y moduleMeta.label.");
  }

  return metadata;
}

function getModuleDescription(module) {
  return module?.moduleMeta?.description
    || module?.moduleConfig?.description
    || MODULE_DESCRIPTIONS[module?.moduleMeta?.id]
    || "Abrir esta sección de JobConnect.";
}

export function buildNavigationMarkup(modules) {
  return modules.map((module, index) => {
    const metadata = getModuleMetadata(module);
    const description = getModuleDescription(module);

    return `<button class="nav-item" type="button" data-module="${escapeHtml(metadata.id)}" data-nav-index="${index}" data-nav-description="${escapeHtml(description)}" aria-pressed="false" style="--nav-index:${index}">
      <span class="nav-item__mark" aria-hidden="true">${escapeHtml(metadata.shortLabel || metadata.label.slice(0, 2).toUpperCase())}</span>
      <span class="nav-item__copy"><strong>${escapeHtml(metadata.label)}</strong><small>${escapeHtml(description)}</small></span>
      <span class="nav-item__arrow" aria-hidden="true">↗</span>
    </button>`;
  }).join("");
}

export function renderShell({ root, modules, onSelect, onLogout, profileService, onProfileSaved, interfaceMotion, themeController }) {
  if (!root) throw new Error("No se encontró el contenedor principal de JobConnect.");
  if (!profileService) throw new Error("No se configuró el servicio de perfil.");

  root.innerHTML = `<div class="app-shell">
    <span class="shell-pointer-aura" data-shell-aura aria-hidden="true"></span>
    <div class="main-panel">
      <header class="topbar">
        <div class="brand brand--topbar"><span class="brand-mark" aria-hidden="true">JC</span><span>JobConnect</span></div>
        <button class="menu-launch" type="button" data-open-navigation aria-controls="navigation-panel" aria-expanded="false">
          <span class="menu-launch__icon" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <span>Menú</span>
        </button>
        <div class="topbar__title"><span class="eyebrow" data-page-context>EMPRESA DIGITAL</span><strong data-page-title>Inicio</strong></div>
        <button class="theme-toggle" type="button" data-theme-toggle aria-label="Activar modo oscuro">
          <span class="theme-toggle__sun" aria-hidden="true"></span>
          <span class="theme-toggle__moon" aria-hidden="true"></span>
        </button>
        <button class="profile-trigger" type="button" data-open-profile aria-controls="profile-panel" aria-expanded="false">
          <span class="profile-trigger__avatar" data-profile-initials>EJ</span>
          <span class="profile-trigger__copy"><strong data-profile-name>Emily Johnson</strong><small data-profile-type>Busco trabajo</small></span>
          <span class="profile-trigger__arrow" aria-hidden="true">⌄</span>
        </button>
      </header>
      <main id="module-content" tabindex="-1"></main>
    </div>

    <button class="panel-backdrop" type="button" tabindex="-1" data-close-panels aria-label="Cerrar panel abierto"></button>

    <aside id="navigation-panel" class="navigation-panel app-drawer app-drawer--left" aria-labelledby="navigation-panel-title" aria-hidden="true">
      <div class="app-drawer__header">
        <div class="brand"><span class="brand-mark" aria-hidden="true">JC</span><span>JobConnect</span></div>
        <button type="button" class="panel-close" data-close-navigation aria-label="Cerrar navegación">×</button>
      </div>
      <div class="navigation-panel__intro">
        <div class="navigation-panel__copy">
          <p class="eyebrow">CENTRO DE NAVEGACIÓN</p>
          <h2 id="navigation-panel-title">¿Qué deseas hacer?</h2>
          <p>Selecciona una sección para consultar información o gestionar el proceso de empleabilidad.</p>
        </div>
        <div class="navigation-preview" data-navigation-preview data-module-preview="home" aria-live="polite">
          <div class="navigation-preview__top"><span data-navigation-number>01</span><small>SECCIÓN DISPONIBLE</small></div>
          <strong data-navigation-title>Inicio</strong>
          <p data-navigation-description>${escapeHtml(MODULE_DESCRIPTIONS.home)}</p>
          <div class="navigation-preview__visual" aria-hidden="true"><span></span><i></i></div>
        </div>
      </div>
      <nav class="nav-list" aria-label="Secciones de JobConnect">${buildNavigationMarkup(modules)}</nav>
    </aside>

    <aside id="profile-panel" class="profile-panel app-drawer app-drawer--right" aria-label="Perfil y preferencias" aria-hidden="true" data-profile-root></aside>
  </div>`;

  const contentContainer = root.querySelector("#module-content");
  const mainPanel = root.querySelector(".main-panel");
  const pageContext = root.querySelector("[data-page-context]");
  const pageTitle = root.querySelector("[data-page-title]");
  const navigationPanel = root.querySelector("#navigation-panel");
  const profilePanelRoot = root.querySelector("#profile-panel");
  const menuTrigger = root.querySelector("[data-open-navigation]");
  const profileTrigger = root.querySelector("[data-open-profile]");
  const themeToggle = root.querySelector("[data-theme-toggle]");
  const backdrop = root.querySelector("[data-close-panels]");
  const navigationPreview = root.querySelector("[data-navigation-preview]");
  const cleanupCallbacks = [];
  let activePanel = null;
  let previousFocus = null;

  const panels = {
    navigation: { element: navigationPanel, trigger: menuTrigger },
    profile: { element: profilePanelRoot, trigger: profileTrigger }
  };

  function updateProfileTrigger(profile) {
    root.querySelector("[data-profile-initials]").textContent = getProfileInitials(profile.fullName);
    root.querySelector("[data-profile-name]").textContent = profile.fullName;
    root.querySelector("[data-profile-type]").textContent = getAccountTypeLabel(profile.accountType);
  }

  function closePanels({ restoreFocus = true } = {}) {
    if (!activePanel) return;

    for (const panel of Object.values(panels)) {
      panel.element.classList.remove("is-open");
      panel.element.setAttribute("aria-hidden", "true");
      panel.trigger.setAttribute("aria-expanded", "false");
    }

    backdrop.classList.remove("is-visible");
    document.body.classList.remove("has-app-panel");
    activePanel = null;

    if (restoreFocus) previousFocus?.focus?.();
    previousFocus = null;
  }

  function openPanel(panelName) {
    const panel = panels[panelName];
    if (!panel) return;

    if (activePanel === panelName) {
      closePanels();
      return;
    }

    closePanels({ restoreFocus: false });
    activePanel = panelName;
    previousFocus = panel.trigger;
    panel.element.classList.add("is-open");
    panel.element.setAttribute("aria-hidden", "false");
    panel.trigger.setAttribute("aria-expanded", "true");
    backdrop.classList.add("is-visible");
    document.body.classList.add("has-app-panel");

    const firstControl = panel.element.querySelector("button, input, select, textarea");
    globalThis.requestAnimationFrame?.(() => firstControl?.focus());
    interfaceMotion?.revealPanel?.(panel.element);
  }

  const profileController = createProfilePanel({
    root: profilePanelRoot,
    profileService,
    onClose: () => closePanels(),
    onLogout,
    onSave: profile => {
      updateProfileTrigger(profile);
      onProfileSaved?.(profile);
    },
    interfaceMotion
  });

  const removeThemeBinding = themeController?.bind?.(themeToggle) ?? (() => {});
  cleanupCallbacks.push(removeThemeBinding);

  const menuHandler = () => openPanel("navigation");
  const profileHandler = () => openPanel("profile");
  const backdropHandler = () => closePanels();
  const navigationCloseHandler = () => closePanels();

  menuTrigger.addEventListener("click", menuHandler);
  profileTrigger.addEventListener("click", profileHandler);
  backdrop.addEventListener("click", backdropHandler);
  root.querySelector("[data-close-navigation]").addEventListener("click", navigationCloseHandler);

  cleanupCallbacks.push(() => menuTrigger.removeEventListener("click", menuHandler));
  cleanupCallbacks.push(() => profileTrigger.removeEventListener("click", profileHandler));
  cleanupCallbacks.push(() => backdrop.removeEventListener("click", backdropHandler));
  cleanupCallbacks.push(() => root.querySelector("[data-close-navigation]")?.removeEventListener("click", navigationCloseHandler));

  for (const button of root.querySelectorAll("[data-module]")) {
    const updatePreview = () => {
      if (!navigationPreview) return;
      const module = modules.find(item => getModuleMetadata(item).id === button.dataset.module);
      const metadata = module ? getModuleMetadata(module) : null;
      if (!metadata) return;

      navigationPreview.dataset.modulePreview = metadata.id;
      navigationPreview.querySelector("[data-navigation-number]").textContent = String(Number(button.dataset.navIndex) + 1).padStart(2, "0");
      navigationPreview.querySelector("[data-navigation-title]").textContent = metadata.label;
      navigationPreview.querySelector("[data-navigation-description]").textContent = getModuleDescription(module);
      navigationPreview.animate?.([
        { opacity: 0.72, transform: "translateY(6px)" },
        { opacity: 1, transform: "translateY(0)" }
      ], { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    };
    const handler = async () => {
      closePanels({ restoreFocus: false });
      await onSelect(button.dataset.module);
    };

    button.addEventListener("click", handler);
    button.addEventListener("pointerenter", updatePreview);
    button.addEventListener("focus", updatePreview);
    cleanupCallbacks.push(() => button.removeEventListener("click", handler));
    cleanupCallbacks.push(() => button.removeEventListener("pointerenter", updatePreview));
    cleanupCallbacks.push(() => button.removeEventListener("focus", updatePreview));
  }

  const keyHandler = event => {
    if (event.key === "Escape") {
      closePanels();
      return;
    }

    if (event.key !== "Tab" || !activePanel) return;
    const activeElement = panels[activePanel].element;
    const controls = [...activeElement.querySelectorAll("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])")];
    if (!controls.length) return;

    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  document.addEventListener("keydown", keyHandler);
  cleanupCallbacks.push(() => document.removeEventListener("keydown", keyHandler));

  function setActive(moduleId) {
    const activeModule = modules.find(module => getModuleMetadata(module).id === moduleId);
    const activeMetadata = activeModule ? getModuleMetadata(activeModule) : null;

    for (const button of root.querySelectorAll("[data-module]")) {
      const isActive = button.dataset.module === moduleId;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
      if (isActive) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    }

    mainPanel.classList.toggle("is-home", moduleId === "home");
    pageContext.textContent = moduleId === "home" ? "EMPRESA DIGITAL" : "GESTIÓN DE TALENTO";
    pageTitle.textContent = activeMetadata?.label || "JobConnect";
  }

  function setUser(profile = profileService.get()) {
    updateProfileTrigger(profile.accountType ? profile : profileService.get());
  }

  function destroy() {
    closePanels({ restoreFocus: false });
    profileController.destroy();
    cleanupCallbacks.forEach(cleanup => cleanup());
    root.replaceChildren();
  }

  updateProfileTrigger(profileService.get());

  return Object.freeze({ contentContainer, setActive, setUser, closeMenu: closePanels, destroy });
}
