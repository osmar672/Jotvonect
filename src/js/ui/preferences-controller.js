const PREFS_KEY = "jobconnect.accessibility";
const TRANSLATIONS = {
  en: { "Menú":"Menu", "Inicio":"Home", "Vacantes":"Jobs", "Empresas clientes":"Companies", "Postulaciones":"Applications", "Candidatos":"Candidates", "Entrevistas y notas":"Interviews and notes", "Tareas":"Tasks", "Mis currículums":"My résumés", "Dashboard general":"General dashboard", "Nuevo registro":"New record", "Actualizar":"Refresh", "Guardar":"Save", "Cancelar":"Cancel", "Eliminar":"Delete", "Aplicar":"Apply", "Buscar registros…":"Search records…", "Asistente IA":"AI Assistant", "Enviar":"Send", "Configurar perfil":"Profile settings", "Cerrar sesión":"Sign out", "Modo claro":"Light mode", "Modo oscuro":"Dark mode", "Accesibilidad":"Accessibility", "Idioma":"Language", "Bajo rendimiento":"Low performance" },
  zh: { "Menú":"菜单", "Inicio":"首页", "Vacantes":"职位", "Empresas clientes":"公司", "Postulaciones":"申请", "Candidatos":"候选人", "Entrevistas y notas":"面试与备注", "Tareas":"任务", "Mis currículums":"我的简历", "Dashboard general":"综合仪表板", "Nuevo registro":"新建记录", "Actualizar":"刷新", "Guardar":"保存", "Cancelar":"取消", "Eliminar":"删除", "Aplicar":"申请", "Buscar registros…":"搜索记录…", "Asistente IA":"AI 助手", "Enviar":"发送", "Configurar perfil":"个人资料设置", "Cerrar sesión":"退出登录", "Modo claro":"浅色模式", "Modo oscuro":"深色模式", "Accesibilidad":"无障碍", "Idioma":"语言", "Bajo rendimiento":"低性能模式" }
};

export function applyEarlyPreferences(storage = globalThis.localStorage) {
  try {
    const prefs = JSON.parse(storage?.getItem(PREFS_KEY) || "{}");
    document.documentElement.classList.toggle("low-performance", Boolean(prefs.lowPerformance));
    if (prefs.vision) document.documentElement.dataset.colorVision = prefs.vision;
    if (prefs.language) document.documentElement.lang = prefs.language === "zh" ? "zh" : prefs.language;
    return prefs;
  } catch { return {}; }
}

export function createPreferencesController(root, storage = globalThis.localStorage) {
  let prefs = { language: "es", vision: "default", lowPerformance: false };
  try { prefs = { ...prefs, ...JSON.parse(storage?.getItem(PREFS_KEY) || "{}") }; } catch {}
  const topbar = root.querySelector(".topbar"); if (!topbar) return () => {};
  const controls = document.createElement("div"); controls.className = "global-preferences";
  controls.innerHTML = `<button type="button" data-pref-open aria-expanded="false">◉ <span>Accesibilidad</span></button><div class="preferences-popover" data-pref-panel hidden><label>Idioma<select data-pref-language><option value="es">Español</option><option value="en">English</option><option value="zh">中文</option></select></label><label>Visión de color<select data-pref-vision><option value="default">Estándar</option><option value="protanopia">Protanopia</option><option value="deuteranopia">Deuteranopia</option><option value="tritanopia">Tritanopia</option><option value="achromatopsia">Acromatopsia</option></select></label><label class="performance-switch"><input type="checkbox" data-pref-performance><span>Modo bajo rendimiento</span></label></div>`;
  topbar.insertBefore(controls, topbar.querySelector("[data-theme-toggle]"));
  const panel = controls.querySelector("[data-pref-panel]"), opener = controls.querySelector("[data-pref-open]"), language = controls.querySelector("[data-pref-language]"), vision = controls.querySelector("[data-pref-vision]"), performance = controls.querySelector("[data-pref-performance]");
  language.value = prefs.language; vision.value = prefs.vision; performance.checked = prefs.lowPerformance;
  const originalNodes = new Map();
  let translationVersion = 0;
  let translationTimer = null;
  function collectTextNodes() {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode(node) { const parent = node.parentElement; return parent && !parent.closest("script, style, [contenteditable='true']") && /[\p{L}]/u.test(node.nodeValue.trim()) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
    let node; while ((node = walker.nextNode())) if (!originalNodes.has(node)) originalNodes.set(node, node.nodeValue);
    for (const saved of originalNodes.keys()) if (!saved.isConnected) originalNodes.delete(saved);
  }
  function getCache(languageCode) { try { return JSON.parse(storage?.getItem(`jobconnect.translations.${languageCode}`) || "{}"); } catch { return {}; } }
  async function translate() {
    const version = ++translationVersion;
    document.documentElement.lang = prefs.language === "zh" ? "zh" : prefs.language;
    const dictionary = TRANSLATIONS[prefs.language] || {};
    collectTextNodes();
    const placeholders = [...root.querySelectorAll("input[placeholder], textarea[placeholder]")];
    for (const element of placeholders) element.dataset.i18nPlaceholder ||= element.placeholder;
    if (prefs.language === "es") {
      for (const [node, original] of originalNodes) if (node.nodeValue !== original) node.nodeValue = original;
      for (const element of placeholders) element.placeholder = element.dataset.i18nPlaceholder;
      return;
    }
    const cache = getCache(prefs.language);
    const sources = [...new Set([...originalNodes.values(), ...placeholders.map(element => element.dataset.i18nPlaceholder)].map(text => text.trim()).filter(Boolean))];
    const applyTranslations = () => {
      for (const [node, original] of originalNodes) { const trimmed = original.trim(); const translated = dictionary[trimmed] || cache[trimmed]; if (translated) node.nodeValue = original.replace(trimmed, translated); }
      for (const element of placeholders) { const source = element.dataset.i18nPlaceholder; element.placeholder = dictionary[source] || cache[source] || source; }
    };
    applyTranslations();
    const missing = sources.filter(source => !dictionary[source] && !cache[source]);
    for (let index = 0; index < missing.length; index += 25) {
      try {
        const batch = missing.slice(index, index + 25);
        const response = await fetch("/api/translate", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ language:prefs.language, texts:batch }) });
        const data = await response.json(); if (!response.ok) throw new Error(data.error);
        batch.forEach((source, position) => { cache[source] = data.translations[position]; });
        storage?.setItem(`jobconnect.translations.${prefs.language}`, JSON.stringify(cache));
        if (version === translationVersion) applyTranslations();
      } catch (error) { console.warn("No se pudo traducir un bloque de la interfaz:", error.message); break; }
    }
  }
  function apply() { document.documentElement.dataset.colorVision = prefs.vision; document.documentElement.classList.toggle("low-performance", prefs.lowPerformance); storage?.setItem(PREFS_KEY, JSON.stringify(prefs)); translate(); }
  opener.addEventListener("click", () => { panel.hidden = !panel.hidden; opener.setAttribute("aria-expanded", String(!panel.hidden)); });
  language.addEventListener("change", () => { prefs.language = language.value; apply(); }); vision.addEventListener("change", () => { prefs.vision = vision.value; apply(); }); performance.addEventListener("change", () => { prefs.lowPerformance = performance.checked; storage?.setItem(PREFS_KEY, JSON.stringify(prefs)); globalThis.location?.reload?.(); });
  const observer = new MutationObserver(() => { clearTimeout(translationTimer); translationTimer = setTimeout(translate, 80); }); observer.observe(root, { childList:true, subtree:true }); apply();
  return () => { clearTimeout(translationTimer); observer.disconnect(); controls.remove(); };
}
