export const THEME_STORAGE_KEY = "jobconnect.theme";

function getSystemTheme() {
  return globalThis.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

function normalizeTheme(value) {
  return value === "dark" || value === "light" ? value : getSystemTheme();
}

export function createThemeController({
  root = globalThis.document?.documentElement ?? null,
  storage = globalThis.localStorage
} = {}) {
  let theme = getSystemTheme();

  try {
    theme = normalizeTheme(storage?.getItem(THEME_STORAGE_KEY));
  } catch {
    theme = getSystemTheme();
  }

  function apply(nextTheme) {
    theme = normalizeTheme(nextTheme);
    root?.setAttribute?.("data-theme", theme);
    if (root?.style) root.style.colorScheme = theme;

    try {
      storage?.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // El tema sigue activo durante la sesión aunque el almacenamiento esté bloqueado.
    }

    return theme;
  }

  function updateButton(button) {
    if (!button) return;
    button.dataset.currentTheme = theme;
    button.setAttribute("aria-label", theme === "dark" ? "Activar modo claro" : "Activar modo oscuro");
    button.setAttribute("title", theme === "dark" ? "Modo claro" : "Modo oscuro");
  }

  function bind(button) {
    if (!button) return () => {};
    updateButton(button);

    const handleClick = () => {
      apply(theme === "dark" ? "light" : "dark");
      updateButton(button);
      button.animate?.([
        { transform: "rotate(-12deg) scale(0.88)" },
        { transform: "rotate(0deg) scale(1)" }
      ], { duration: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    };

    button.addEventListener("click", handleClick);
    return () => button.removeEventListener("click", handleClick);
  }

  apply(theme);
  return Object.freeze({ get: () => theme, apply, bind });
}
