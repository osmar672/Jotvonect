let localKeySequence = 0;
import { canManageModule, ROLES } from "../auth/access-control.js";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[character]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function createLocalKey() {
  localKeySequence += 1;
  return `local:${Date.now()}:${localKeySequence}`;
}

function attachClientMetadata(item, index) {
  const id = item?.id ?? `index-${index}`;

  return {
    ...item,
    __clientKey: `server:${String(id)}`,
    __isLocal: false
  };
}

function getItemByKey(items, key) {
  return items.find(item => item.__clientKey === key) || null;
}

function validateConfig(config) {
  const requiredKeys = ["moduleMeta", "resourcePath", "createPath", "listKey", "fields", "updateMethods"];

  for (const key of requiredKeys) {
    if (config?.[key] === undefined) throw new Error(`Configuración CRUD incompleta: falta ${key}.`);
  }

  if (!config.createPath.endsWith("/add")) {
    throw new Error(`La ruta POST de ${config.moduleMeta.label} debe terminar en /add.`);
  }

  for (const method of config.updateMethods) {
    if (!['put', 'patch'].includes(method)) {
      throw new Error(`Método de actualización no soportado: ${method}.`);
    }
  }
}

function renderField(field) {
  const id = `field-${field.name}`;
  const required = field.required ? " required" : "";
  const placeholder = field.placeholder ? ` placeholder="${escapeAttribute(field.placeholder)}"` : "";
  const minimum = field.min !== undefined ? ` min="${escapeAttribute(field.min)}"` : "";
  const maximum = field.max !== undefined ? ` max="${escapeAttribute(field.max)}"` : "";
  const step = field.step !== undefined ? ` step="${escapeAttribute(field.step)}"` : "";
  const autocomplete = field.autocomplete ? ` autocomplete="${escapeAttribute(field.autocomplete)}"` : "";

  if (field.type === "checkbox") {
    return `<label class="form-checkbox" for="${id}">
      <input id="${id}" name="${escapeAttribute(field.name)}" type="checkbox">
      <span>${escapeHtml(field.label)}</span>
    </label>`;
  }

  if (field.type === "textarea") {
    return `<label for="${id}">${escapeHtml(field.label)}
      <textarea id="${id}" name="${escapeAttribute(field.name)}" rows="4"${required}${placeholder}></textarea>
    </label>`;
  }

  if (field.type === "select") {
    const options = (field.options || []).map(option => {
      const value = typeof option === "object" ? option.value : option;
      const label = typeof option === "object" ? option.label : option;
      return `<option value="${escapeAttribute(value)}">${escapeHtml(label)}</option>`;
    }).join("");

    return `<label for="${id}">${escapeHtml(field.label)}
      <select id="${id}" name="${escapeAttribute(field.name)}"${required}>${options}</select>
    </label>`;
  }

  return `<label for="${id}">${escapeHtml(field.label)}
    <input id="${id}" name="${escapeAttribute(field.name)}" type="${escapeAttribute(field.type || "text")}"${required}${placeholder}${minimum}${maximum}${step}${autocomplete}>
  </label>`;
}

export function buildModuleLayout(config) {
  validateConfig(config);

  const shortLabel = config.moduleMeta.shortLabel || config.moduleMeta.label.slice(0, 2).toUpperCase();

  return `<section class="module module--${escapeAttribute(config.moduleMeta.id)}" aria-labelledby="module-title" data-module-root>
    <div class="module-ambient" aria-hidden="true"><span></span><span></span><i></i></div>
    <header class="module-head">
      <div>
        <p class="eyebrow">JOBCONNECT / ${escapeHtml(shortLabel)}</p>
        <h1 id="module-title">${escapeHtml(config.moduleMeta.label)}</h1>
        <p>${escapeHtml(config.description)}</p>
      </div>
      <button class="btn btn--primary btn--create" type="button" data-action="new"><span aria-hidden="true">＋</span> Nuevo registro</button>
    </header>

    <div class="module-insights" aria-label="Resumen del módulo">
      <article class="module-insight module-insight--primary"><span class="module-insight__icon" aria-hidden="true">${escapeHtml(shortLabel)}</span><div><strong data-stat-total>0</strong><small>REGISTROS TOTALES</small></div></article>
      <article class="module-insight"><span class="module-insight__icon" aria-hidden="true">⌕</span><div><strong data-stat-visible>0</strong><small>RESULTADOS VISIBLES</small></div></article>
      <article class="module-insight"><span class="module-insight__icon" aria-hidden="true">＋</span><div><strong data-stat-local>0</strong><small>CAMBIOS DE ESTA SESIÓN</small></div></article>
    </div>

    <div class="module-toolbar">
      <label class="search-field">
        <span class="sr-only">Buscar en ${escapeHtml(config.moduleMeta.label)}</span>
        <input data-search type="search" placeholder="Buscar registros…" aria-label="Buscar en ${escapeAttribute(config.moduleMeta.label)}">
      </label>
      <label class="sort-field"><span class="sr-only">Ordenar registros</span><select data-sort aria-label="Ordenar registros"><option value="default">Orden original</option><option value="title-asc">Nombre A–Z</option><option value="title-desc">Nombre Z–A</option><option value="recent">Más recientes</option></select></label>
      <div class="view-switch" role="group" aria-label="Cambiar vista">
        <button class="view-option is-active" type="button" data-view-mode="grid" aria-pressed="true" aria-label="Vista de tarjetas"><span aria-hidden="true" class="view-icon view-icon--grid"><i></i><i></i><i></i><i></i></span></button>
        <button class="view-option" type="button" data-view-mode="list" aria-pressed="false" aria-label="Vista de lista"><span aria-hidden="true" class="view-icon view-icon--list"><i></i><i></i><i></i></span></button>
      </div>
      <span class="module-count" data-count>0 registros</span>
      <button class="btn btn--compact btn--reload" type="button" data-action="reload"><span aria-hidden="true">↻</span> Actualizar</button>
    </div>

    <button class="entity-form-backdrop" type="button" data-action="cancel" data-form-backdrop tabindex="-1" aria-label="Cerrar editor"></button>
    <aside class="entity-form-panel" data-form-panel role="dialog" aria-modal="true" aria-labelledby="entity-form-title" aria-hidden="true">
      <form data-form class="entity-form" hidden>
        <div class="entity-form__header">
          <div>
            <p class="eyebrow" data-form-method>POST</p>
            <h2 id="entity-form-title" data-form-title>Nuevo registro</h2>
            <p>Completa la información y guarda los cambios cuando esté lista.</p>
          </div>
          <button class="btn btn--icon" type="button" data-action="cancel" aria-label="Cerrar formulario">×</button>
        </div>
        <div class="form-grid">${config.fields.map(renderField).join("")}</div>
        <div class="form-actions">
          <button type="button" class="btn" data-action="cancel">Cancelar</button>
          <button class="btn btn--primary" type="submit" data-submit>Guardar</button>
        </div>
      </form>
    </aside>

    <div data-state class="module-state" role="status" aria-live="polite">Cargando registros…</div>
    <div data-list class="entity-list entity-list--grid"></div>
  </section>`;
}

export async function persistEntity({ api, config, currentItem = null, payload, method = "post" }) {
  validateConfig(config);

  if (!currentItem) {
    const result = await api.post(config.createPath, payload);

    return {
      ...payload,
      ...(result || {}),
      __clientKey: createLocalKey(),
      __isLocal: true
    };
  }

  if (!config.updateMethods.includes(method)) {
    throw new Error(`El método ${method.toUpperCase()} no está permitido en este módulo.`);
  }

  const result = currentItem.__isLocal
    ? payload
    : await api[method](`${config.resourcePath}/${currentItem.id}`, payload);

  return {
    ...currentItem,
    ...(result || {}),
    ...payload,
    __clientKey: currentItem.__clientKey,
    __isLocal: currentItem.__isLocal
  };
}

export async function removeEntity({ api, config, currentItem }) {
  if (!currentItem) throw new Error("El registro que intentas eliminar ya no existe.");
  if (currentItem.__isLocal) return null;

  return api.remove(`${config.resourcePath}/${currentItem.id}`);
}

export function createCrudModule(config) {
  validateConfig(config);

  let container = null;
  let services = null;
  let items = [];
  let editing = null;
  let searchTerm = "";
  let sortMode = "default";
  let viewMode = "grid";
  let mounted = false;
  let requestVersion = 0;
  let cleanupCallbacks = [];

  function query(selector) {
    return container?.querySelector(selector) || null;
  }

  function showState(message, type = "empty") {
    const state = query("[data-state]");
    const list = query("[data-list]");

    if (!state || !list) return;

    state.hidden = false;
    state.className = `module-state is-${type}`;
    state.innerHTML = `<span class="module-state__visual" aria-hidden="true"><i></i><i></i><i></i></span><strong>${type === "error" ? "No pudimos completar la carga" : "Aún no hay información"}</strong><p>${escapeHtml(message)}</p>${type === "error" ? '<button class="btn btn--compact" type="button" data-action="reload">Intentar nuevamente</button>' : ""}`;
    list.innerHTML = "";
  }

  function showLoadingSkeleton() {
    const state = query("[data-state]");
    const list = query("[data-list]");
    if (!state || !list) return;

    state.hidden = true;
    list.className = `entity-list entity-list--${viewMode} is-loading`;
    list.innerHTML = Array.from({ length: 6 }, () => `<article class="entity-card entity-card--skeleton" aria-hidden="true">
      <span class="skeleton skeleton--avatar"></span>
      <div class="entity-card__content"><span class="skeleton skeleton--title"></span><span class="skeleton skeleton--text"></span><span class="skeleton skeleton--meta"></span></div>
    </article>`).join("");
  }

  function cardMarkup(item, index) {
    const view = config.card(item);
    const manageable = !services?.role || canManageModule(services.role, config.moduleMeta.id);
    const methods = manageable ? config.updateMethods.map(method => {
      const label = method === "put" ? "Editar (PUT)" : "Editar (PATCH)";
      return `<button class="btn btn--compact" type="button" data-action="edit" data-method="${method}" data-key="${escapeAttribute(item.__clientKey)}">${label}</button>`;
    }).join("") : "";
    const resumes = services?.role === ROLES.EMPLOYEE && config.employeeCanApply ? (services.resumes?.list?.() || []) : [];
    const applicationAction = services?.role === ROLES.EMPLOYEE && config.employeeCanApply
      ? `<div class="vacancy-apply"><select data-resume-choice aria-label="Currículum para ${escapeAttribute(view.title)}"><option value="">Elegir currículum…</option>${resumes.map(resume => `<option value="${escapeAttribute(resume.id)}">${escapeHtml(resume.name)}</option>`).join("")}</select><button class="btn btn--compact btn--primary" type="button" data-action="apply" data-key="${escapeAttribute(item.__clientKey)}">Aplicar</button></div>`
      : "";

    const metadata = (view.meta || []).map(value => `<span>${escapeHtml(value)}</span>`).join("");
    const status = view.status || (item.__isLocal ? "NUEVO" : "ACTIVO");
    const initials = String(view.title || config.moduleMeta.shortLabel || "JC")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join("")
      .toUpperCase();

    return `<article class="entity-card" data-entity-key="${escapeAttribute(item.__clientKey)}" style="--card-order:${index}">
      <div class="entity-card__identity" aria-hidden="true"><span>${escapeHtml(initials)}</span><small>${String(index + 1).padStart(2, "0")}</small></div>
      <div class="entity-card__content">
        <div class="entity-card__heading"><h2>${escapeHtml(view.title || "Registro")}</h2><span class="entity-card__status">${escapeHtml(status)}</span></div>
        <p>${escapeHtml(view.description || "Sin descripción")}</p>
        <div class="entity-card__meta">${metadata}</div>
      </div>
      <div class="card-actions">
        ${applicationAction}
        ${methods}
        ${manageable ? `<button class="btn btn--compact btn--danger" type="button" data-action="delete" data-key="${escapeAttribute(item.__clientKey)}">Eliminar</button>` : ""}
      </div>
    </article>`;
  }

  function updateInsights(visibleCount) {
    const motion = services?.interfaceMotion;
    const totals = [
      [query("[data-stat-total]"), items.length],
      [query("[data-stat-visible]"), visibleCount],
      [query("[data-stat-local]"), items.filter(item => item.__isLocal).length]
    ];

    for (const [element, value] of totals) {
      if (motion?.animateCounter) motion.animateCounter(element, value);
      else if (element) element.textContent = String(value);
    }
  }

  function renderList({ animate = true, highlightKey = null } = {}) {
    const state = query("[data-state]");
    const list = query("[data-list]");
    const count = query("[data-count]");

    if (!state || !list || !count) return;

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredItems = items.filter(item => {
      if (!normalizedSearch) return true;
      return JSON.stringify(item).toLowerCase().includes(normalizedSearch);
    });

    const sortedItems = [...filteredItems].sort((first, second) => {
      const firstTitle = config.card(first).title || "";
      const secondTitle = config.card(second).title || "";
      if (sortMode === "title-asc") return firstTitle.localeCompare(secondTitle, "es", { sensitivity: "base" });
      if (sortMode === "title-desc") return secondTitle.localeCompare(firstTitle, "es", { sensitivity: "base" });
      if (sortMode === "recent") return Number(second.id || 0) - Number(first.id || 0);
      return 0;
    });

    count.textContent = `${sortedItems.length} registro${sortedItems.length === 1 ? "" : "s"}`;
    updateInsights(sortedItems.length);

    if (!sortedItems.length) {
      state.hidden = false;
      state.className = "module-state is-empty";
      const emptyMessage = normalizedSearch
        ? "Prueba con otra palabra o limpia la búsqueda."
        : "Crea el primer registro para comenzar a trabajar.";
      state.innerHTML = `<span class="module-state__visual" aria-hidden="true"><i></i><i></i><i></i></span><strong>${normalizedSearch ? "Sin coincidencias" : "Espacio listo para comenzar"}</strong><p>${emptyMessage}</p>`;
      list.innerHTML = "";
      return;
    }

    state.hidden = true;
    list.className = `entity-list entity-list--${viewMode}`;
    list.innerHTML = sortedItems.map(cardMarkup).join("");
    if (animate) services?.interfaceMotion?.revealCards?.(list);
    if (highlightKey) services?.interfaceMotion?.highlight?.(list.querySelector?.(`[data-entity-key="${globalThis.CSS?.escape?.(highlightKey) || highlightKey}"]`));
  }

  async function loadItems() {
    const version = ++requestVersion;
    showLoadingSkeleton();
    services.feedback.loading(`Cargando ${config.moduleMeta.label.toLowerCase()}…`);

    try {
      const result = await services.api.get(config.resourcePath);
      if (!mounted || version !== requestVersion) return;

      const records = Array.isArray(result) ? result : result?.[config.listKey];
      if (!Array.isArray(records)) throw new Error("DummyJSON devolvió un formato de datos inesperado.");

      items = records.map(attachClientMetadata);
      services.feedback.clear();
      renderList();
    } catch (error) {
      if (!mounted || version !== requestVersion) return;
      services.feedback.error(error.message);
      showState(error.message, "error");
    }
  }

  function getFieldValue(item, field) {
    if (!item) return field.defaultValue ?? "";
    if (typeof field.getValue === "function") return field.getValue(item);
    return item[field.name] ?? field.defaultValue ?? "";
  }

  function openForm(item = null, method = "post") {
    const form = query("[data-form]");
    const panel = query("[data-form-panel]");
    const backdrop = query("[data-form-backdrop]");
    if (!form) return;

    editing = item ? { key: item.__clientKey, method } : null;
    form.reset();
    form.hidden = false;
    panel?.classList?.add("is-open");
    panel?.setAttribute?.("aria-hidden", "false");
    backdrop?.classList?.add("is-visible");
    globalThis.document?.body?.classList?.add("has-entity-editor");

    query("[data-form-title]").textContent = item ? "Editar registro" : "Nuevo registro";
    query("[data-form-method]").textContent = item ? method.toUpperCase() : "POST";

    for (const field of config.fields) {
      const input = form.elements.namedItem(field.name);
      if (!input) continue;

      const value = getFieldValue(item, field);
      if (field.type === "checkbox") input.checked = Boolean(value);
      else input.value = value ?? "";
    }

    globalThis.requestAnimationFrame?.(() => form.querySelector("input, textarea, select")?.focus());
  }

  function closeForm() {
    const form = query("[data-form]");
    const panel = query("[data-form-panel]");
    const backdrop = query("[data-form-backdrop]");
    if (!form) return;

    form.hidden = true;
    form.reset();
    panel?.classList?.remove("is-open");
    panel?.setAttribute?.("aria-hidden", "true");
    backdrop?.classList?.remove("is-visible");
    globalThis.document?.body?.classList?.remove("has-entity-editor");
    editing = null;
  }

  function collectValues(form) {
    const values = {};

    for (const field of config.fields) {
      const input = form.elements.namedItem(field.name);
      if (!input) continue;

      if (field.type === "checkbox") {
        values[field.name] = input.checked;
        continue;
      }

      const rawValue = typeof input.value === "string" ? input.value.trim() : input.value;

      if (field.type === "number") {
        values[field.name] = rawValue === "" ? null : Number(rawValue);
        if (rawValue !== "" && !Number.isFinite(values[field.name])) {
          throw new Error(`${field.label} debe ser un número válido.`);
        }
      } else {
        values[field.name] = rawValue;
      }

      if (typeof field.parse === "function") {
        values[field.name] = field.parse(values[field.name]);
      }
    }

    return values;
  }

  function setFormBusy(form, busy) {
    form.setAttribute("aria-busy", String(busy));
    const submitButton = form.querySelector("[data-submit]");

    if (submitButton) {
      submitButton.disabled = busy;
      submitButton.textContent = busy ? "Guardando…" : "Guardar";
    }
  }

  async function handleSubmit(event, form) {
    event.preventDefault();
    if (!form.reportValidity()) return;

    setFormBusy(form, true);

    try {
      const values = collectValues(form);
      const method = editing?.method || "post";
      const currentItem = editing ? getItemByKey(items, editing.key) : null;
      const payload = config.buildPayload ? config.buildPayload(values, currentItem, method) : values;

      services.feedback.loading(currentItem ? "Actualizando registro…" : "Creando registro…");

      const savedItem = await persistEntity({
        api: services.api,
        config,
        currentItem,
        payload,
        method
      });

      if (!mounted) return;

      if (currentItem) {
        items = items.map(item => item.__clientKey === currentItem.__clientKey ? savedItem : item);
      } else {
        items = [savedItem, ...items];
      }

      closeForm();
      renderList({ highlightKey: savedItem.__clientKey });
      services.feedback.success(currentItem ? "Registro actualizado correctamente." : "Registro creado correctamente.");
    } catch (error) {
      if (mounted) services.feedback.error(error.message);
    } finally {
      if (mounted) setFormBusy(form, false);
    }
  }

  async function handleDelete(button) {
    const currentItem = getItemByKey(items, button.dataset.key);
    if (!currentItem) throw new Error("El registro que intentas eliminar ya no existe.");

    const confirmed = await services.feedback.confirmDelete(`¿Eliminar “${config.card(currentItem).title}”?`);
    if (!confirmed) return;

    try {
      services.feedback.loading("Eliminando registro…");
      await removeEntity({ api: services.api, config, currentItem });
      if (!mounted) return;

      await services?.interfaceMotion?.removeCard?.(button.closest?.(".entity-card"));
      items = items.filter(item => item.__clientKey !== currentItem.__clientKey);
      renderList();
      services.feedback.success("Registro eliminado correctamente.");
    } catch (error) {
      if (mounted) services.feedback.error(error.message);
    }
  }

  function bind(eventName, selector, handler) {
    const listener = event => {
      const target = event.target?.closest?.(selector);
      if (!target || !container?.contains(target)) return;

      Promise.resolve(handler(event, target)).catch(error => {
        if (mounted) services.feedback.error(error.message || "No se pudo completar la acción.");
      });
    };

    container.addEventListener(eventName, listener);
    cleanupCallbacks.push(() => container?.removeEventListener(eventName, listener));
  }

  function bindEvents() {
    const manageable = !services?.role || canManageModule(services.role, config.moduleMeta.id);
    bind("click", "[data-action='new']", () => { if (manageable) openForm(); });
    bind("click", "[data-action='cancel']", closeForm);
    bind("click", "[data-action='reload']", loadItems);
    bind("click", "[data-action='edit']", (_event, button) => {
      if (!manageable) throw new Error("Tu rol no puede modificar este registro.");
      const item = getItemByKey(items, button.dataset.key);
      if (item) openForm(item, button.dataset.method);
    });
    bind("click", "[data-action='delete']", (_event, button) => {
      if (!manageable) throw new Error("Tu rol no puede eliminar este registro.");
      return handleDelete(button);
    });
    bind("click", "[data-action='apply']", (_event, button) => {
      if (services.role !== ROLES.EMPLOYEE || !config.employeeCanApply) throw new Error("Tu rol no puede aplicar a vacantes.");
      const item = getItemByKey(items, button.dataset.key);
      const resumeId = button.closest?.(".entity-card")?.querySelector?.("[data-resume-choice]")?.value;
      if (!resumeId) throw new Error("Primero elige uno de tus currículums.");
      services.resumes.apply(item, resumeId);
      services.feedback.success(`Aplicaste a “${config.card(item).title}” con el currículum seleccionado.`);
    });
    bind("click", "[data-view-mode]", (_event, button) => {
      viewMode = button.dataset.viewMode === "list" ? "list" : "grid";
      for (const option of container.querySelectorAll?.("[data-view-mode]") || []) {
        const active = option.dataset.viewMode === viewMode;
        option.classList.toggle("is-active", active);
        option.setAttribute("aria-pressed", String(active));
      }
      renderList();
    });
    bind("submit", "[data-form]", handleSubmit);

    const searchInput = query("[data-search]");
    const sortInput = query("[data-sort]");
    const searchHandler = () => {
      searchTerm = searchInput.value;
      renderList({ animate: false });
    };
    const sortHandler = () => {
      sortMode = sortInput.value;
      renderList();
    };

    searchInput?.addEventListener("input", searchHandler);
    sortInput?.addEventListener("change", sortHandler);
    cleanupCallbacks.push(() => searchInput?.removeEventListener("input", searchHandler));
    cleanupCallbacks.push(() => sortInput?.removeEventListener("change", sortHandler));

    const keyHandler = event => {
      const panel = query("[data-form-panel]");
      if (!panel?.classList?.contains("is-open")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeForm();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = [...panel.querySelectorAll("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)")];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    globalThis.document?.addEventListener?.("keydown", keyHandler);
    cleanupCallbacks.push(() => globalThis.document?.removeEventListener?.("keydown", keyHandler));
  }

  async function mount(root, injectedServices) {
    if (!root) throw new Error("No se encontró el contenedor del módulo.");
    if (!injectedServices?.api || !injectedServices?.feedback) {
      throw new Error("Los servicios del módulo no fueron configurados.");
    }

    if (mounted) unmount();

    container = root;
    services = injectedServices;
    items = [];
    editing = null;
    searchTerm = "";
    sortMode = "default";
    viewMode = "grid";
    mounted = true;
    container.innerHTML = buildModuleLayout(config);

    const manageable = !services?.role || canManageModule(services.role, config.moduleMeta.id);
    const createButton = query("[data-action='new']");
    if (createButton && !manageable) createButton.remove?.();

    bindEvents();
    await loadItems();
  }

  function unmount() {
    mounted = false;
    requestVersion += 1;
    closeForm();
    cleanupCallbacks.forEach(cleanup => cleanup());
    cleanupCallbacks = [];
    container?.replaceChildren();
    container = null;
    services = null;
    items = [];
    editing = null;
    searchTerm = "";
    sortMode = "default";
    viewMode = "grid";
  }

  return Object.freeze({ mount, unmount });
}
