import { appendChildren, createElement } from "../core/dom-utils.js";

export function renderShell({
  root,
  modules,
  onSelect,
  onLogout
}) {
  if (!(root instanceof HTMLElement)) {
    throw new TypeError("renderShell requiere un elemento root válido.");
  }

  if (!Array.isArray(modules) || modules.length === 0) {
    throw new TypeError("renderShell requiere al menos un módulo.");
  }

  if (typeof onSelect !== "function" || typeof onLogout !== "function") {
    throw new TypeError("renderShell requiere callbacks de selección y logout.");
  }

  root.replaceChildren();

  const skipLink = createElement("a", {
    className: "skip-link",
    text: "Saltar al contenido principal",
    attributes: { href: "#main-content" }
  });
  const shell = createElement("div", { className: "app-shell" });
  const header = createElement("header", { className: "app-shell__header" });
  const brand = createElement("div", { className: "app-shell__brand" });
  const brandMark = createElement("span", {
    className: "app-shell__brand-mark",
    text: "JC",
    attributes: { "aria-hidden": "true" }
  });
  const brandText = createElement("div", { className: "app-shell__brand-text" });
  const brandName = createElement("span", {
    className: "app-shell__brand-name",
    text: "JobConnect"
  });
  const brandTagline = createElement("span", {
    className: "app-shell__brand-tagline",
    text: "Gestión de reclutamiento"
  });
  const account = createElement("div", { className: "app-shell__account" });
  const user = createElement("div", { className: "app-shell__user" });
  const userLabel = createElement("span", {
    className: "app-shell__user-label",
    text: "Usuario actual"
  });
  const userName = createElement("span", {
    className: "app-shell__user-name",
    text: root.dataset.currentUser || "Usuario autenticado"
  });
  const logoutButton = createElement("button", {
    className: "button button--secondary app-shell__logout",
    text: "Cerrar sesión",
    attributes: { type: "button" }
  });

  logoutButton.addEventListener("click", () => {
    onLogout();
  });

  appendChildren(brandText, brandName, brandTagline);
  appendChildren(brand, brandMark, brandText);
  appendChildren(user, userLabel, userName);
  appendChildren(account, user, logoutButton);
  appendChildren(header, brand, account);

  const layout = createElement("div", { className: "app-shell__layout" });
  const navigation = createElement("nav", {
    className: "app-navigation",
    attributes: { "aria-label": "Módulos de JobConnect" }
  });
  const navigationHeading = createElement("p", {
    className: "app-navigation__heading",
    text: "Módulos"
  });
  const navigationList = createElement("ul", {
    className: "app-navigation__list",
    attributes: { role: "list" }
  });
  const navigationButtons = [];

  const setActiveModule = (moduleId) => {
    for (const button of navigationButtons) {
      const isActive = button.dataset.moduleId === moduleId;

      if (isActive) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }

      button.tabIndex = isActive ? 0 : -1;
    }
  };

  modules.forEach((module, index) => {
    const item = createElement("li");
    const button = createElement("button", {
      className: "app-navigation__button",
      text: module.moduleMeta.label,
      attributes: {
        type: "button",
        "aria-current": index === 0 ? "page" : null
      },
      dataset: { moduleId: module.moduleMeta.id }
    });

    button.tabIndex = index === 0 ? 0 : -1;
    button.addEventListener("click", () => {
      setActiveModule(module.moduleMeta.id);
      onSelect(module.moduleMeta.id);
    });
    navigationButtons.push(button);
    item.append(button);
    navigationList.append(item);
  });

  navigationList.addEventListener("keydown", (event) => {
    const currentIndex = navigationButtons.indexOf(document.activeElement);

    if (currentIndex < 0) {
      return;
    }

    const lastIndex = navigationButtons.length - 1;
    let targetIndex = currentIndex;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      targetIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      targetIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    } else if (event.key === "Home") {
      targetIndex = 0;
    } else if (event.key === "End") {
      targetIndex = lastIndex;
    } else {
      return;
    }

    event.preventDefault();

    navigationButtons.forEach((button, index) => {
      button.tabIndex = index === targetIndex ? 0 : -1;
    });
    navigationButtons[targetIndex].focus();
  });

  appendChildren(navigation, navigationHeading, navigationList);

  if (root.dataset.integrationStatus) {
    navigation.append(createElement("p", {
      className: "app-navigation__status",
      text: root.dataset.integrationStatus,
      attributes: { role: "status" }
    }));
  }

  const main = createElement("main", {
    className: "app-content",
    attributes: { id: "main-content", tabindex: "-1" }
  });
  const intro = createElement("div", { className: "app-content__intro" });
  const title = createElement("h1", {
    className: "app-content__title",
    text: "Panel de gestión"
  });
  const subtitle = createElement("p", {
    className: "app-content__subtitle",
    text: "Administra el proceso de reclutamiento desde un único espacio de trabajo."
  });
  const contentContainer = createElement("div", {
    className: "app-content__module",
    attributes: { "aria-live": "polite" }
  });

  appendChildren(intro, title, subtitle);
  appendChildren(main, intro, contentContainer);
  appendChildren(layout, navigation, main);
  appendChildren(shell, header, layout);
  appendChildren(root, skipLink, shell);

  return {
    contentContainer
  };
}
