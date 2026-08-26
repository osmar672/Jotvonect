const PREFS_KEY = "jobconnect.accessibility";
const ATTRIBUTES = ["placeholder", "aria-label", "title", "alt"];
const BASE_TRANSLATIONS = {
  en: { "Menú":"Menu", "Inicio":"Home", "Vacantes":"Jobs", "Empresas clientes":"Companies", "Postulaciones":"Applications", "Candidatos":"Candidates", "Entrevistas y notas":"Interviews and notes", "Tareas":"Tasks", "Mis currículums":"My résumés", "Dashboard general":"General dashboard", "Nuevo registro":"New record", "Actualizar":"Refresh", "Guardar":"Save", "Cancelar":"Cancel", "Eliminar":"Delete", "Aplicar":"Apply", "Asistente IA":"AI Assistant", "Enviar":"Send", "Cerrar sesión":"Sign out", "Conectamos":"We connect", "talento":"talent", "con futuro.":"with the future.", "Una plataforma digital para organizar oportunidades, personas y procesos de empleabilidad desde un solo lugar.":"A digital platform to organize opportunities, people and employment processes in one place.", "Explorar talento":"Explore talent", "Ver vacantes":"View jobs", "DESPLÁZATE":"SCROLL", "SOMOS JOBCONNECT":"WE ARE JOBCONNECT", "Tecnología que acerca a las personas correctas.":"Technology that brings the right people closer.", "Somos una empresa digital orientada a la gestión de empleabilidad. Conectamos talento, empresas y equipos de reclutamiento mediante una experiencia clara, ordenada y confiable.":"We are a digital company focused on employment management. We connect talent, companies and recruiting teams through a clear, organized and reliable experience.", "Nuestra solución centraliza candidatos, vacantes, empresas, postulaciones, entrevistas y tareas, haciendo visible cada paso del proceso.":"Our solution centralizes candidates, jobs, companies, applications, interviews and tasks, making every step of the process visible.", "NUESTRA FORMA DE TRABAJAR":"HOW WE WORK", "Del problema a una solución verificable.":"From the problem to a verifiable solution.", "Un proceso simple para reducir incertidumbre y entregar valor real.":"A simple process to reduce uncertainty and deliver real value.", "Entender":"Understand", "Diseñar":"Design", "Construir":"Build", "Validar":"Validate", "Analizamos la necesidad, el usuario y el resultado esperado.":"We analyze the need, the user and the expected outcome.", "Definimos componentes, contratos y flujos antes de integrar.":"We define components, contracts and flows before integrating.", "Implementamos piezas legibles, enfocadas y reutilizables.":"We implement readable, focused and reusable pieces.", "Probamos rutas, estados, accesibilidad y comportamiento completo.":"We test routes, states, accessibility and complete behavior.", "LISTOS PARA CONECTAR":"READY TO CONNECT", "El próximo gran talento ya está más cerca.":"The next great talent is now closer.", "Comenzar ahora":"Get started", "Bienvenido de nuevo.":"Welcome back.", "Inicia sesión para gestionar candidatos, vacantes y procesos de contratación.":"Sign in to manage candidates, jobs and hiring processes.", "¿Cómo deseas ingresar?":"How would you like to sign in?", "Empleado":"Employee", "Empleador":"Employer", "Administrador":"Administrator", "Usuario":"Username", "Contraseña":"Password", "Iniciar sesión":"Sign in", "Completar datos de acceso":"Fill access details", "Accesibilidad":"Accessibility", "Idioma":"Language", "Visión de color":"Color vision", "Modo bajo rendimiento":"Low performance mode" },
  zh: { "Menú":"菜单", "Inicio":"首页", "Vacantes":"职位", "Empresas clientes":"公司", "Postulaciones":"申请", "Candidatos":"候选人", "Entrevistas y notas":"面试与备注", "Tareas":"任务", "Mis currículums":"我的简历", "Dashboard general":"综合仪表板", "Nuevo registro":"新建记录", "Actualizar":"刷新", "Guardar":"保存", "Cancelar":"取消", "Eliminar":"删除", "Aplicar":"申请", "Asistente IA":"AI 助手", "Enviar":"发送", "Cerrar sesión":"退出登录", "Conectamos":"连接", "talento":"人才", "con futuro.":"与未来。", "Una plataforma digital para organizar oportunidades, personas y procesos de empleabilidad desde un solo lugar.":"一个集中管理机会、人才和就业流程的数字平台。", "Explorar talento":"探索人才", "Ver vacantes":"查看职位", "DESPLÁZATE":"滚动", "SOMOS JOBCONNECT":"我们是 JOBCONNECT", "Tecnología que acerca a las personas correctas.":"让合适的人更接近的技术。", "Somos una empresa digital orientada a la gestión de empleabilidad. Conectamos talento, empresas y equipos de reclutamiento mediante una experiencia clara, ordenada y confiable.":"我们是一家专注于就业管理的数字公司，通过清晰、有序、可靠的体验连接人才、企业和招聘团队。", "Nuestra solución centraliza candidatos, vacantes, empresas, postulaciones, entrevistas y tareas, haciendo visible cada paso del proceso.":"我们的解决方案集中管理候选人、职位、公司、申请、面试和任务，让流程的每一步都清晰可见。", "NUESTRA FORMA DE TRABAJAR":"我们的工作方式", "Del problema a una solución verificable.":"从问题到可验证的解决方案。", "Un proceso simple para reducir incertidumbre y entregar valor real.":"通过简单流程减少不确定性并创造真实价值。", "Entender":"理解", "Diseñar":"设计", "Construir":"构建", "Validar":"验证", "Analizamos la necesidad, el usuario y el resultado esperado.":"我们分析需求、用户和预期结果。", "Definimos componentes, contratos y flujos antes de integrar.":"集成前定义组件、约定和流程。", "Implementamos piezas legibles, enfocadas y reutilizables.":"实现清晰、专注且可复用的组件。", "Probamos rutas, estados, accesibilidad y comportamiento completo.":"测试路由、状态、无障碍和完整行为。", "LISTOS PARA CONECTAR":"准备连接", "El próximo gran talento ya está más cerca.":"下一位优秀人才已近在咫尺。", "Comenzar ahora":"立即开始", "Bienvenido de nuevo.":"欢迎回来。", "Inicia sesión para gestionar candidatos, vacantes y procesos de contratación.":"登录以管理候选人、职位和招聘流程。", "¿Cómo deseas ingresar?":"您希望如何登录？", "Empleado":"员工", "Empleador":"雇主", "Administrador":"管理员", "Usuario":"用户名", "Contraseña":"密码", "Iniciar sesión":"登录", "Completar datos de acceso":"填写登录信息", "Accesibilidad":"无障碍", "Idioma":"语言", "Visión de color":"色觉", "Modo bajo rendimiento":"低性能模式" }
};

function readPreferences(storage) { try { return JSON.parse(storage?.getItem(PREFS_KEY) || "{}"); } catch { return {}; } }
function readCache(storage, language) { try { return JSON.parse(storage?.getItem(`jobconnect.translations.${language}`) || "{}"); } catch { return {}; } }
function hasWords(value) { return /[\p{L}]/u.test(String(value || "")); }

export function applyEarlyPreferences(storage = globalThis.localStorage) {
  const prefs = readPreferences(storage);
  document.documentElement.classList.toggle("low-performance", Boolean(prefs.lowPerformance));
  if (prefs.vision) document.documentElement.dataset.colorVision = prefs.vision;
  if (prefs.language) document.documentElement.lang = prefs.language === "zh" ? "zh" : prefs.language;
  document.documentElement.classList.toggle("translation-pending", Boolean(prefs.language && prefs.language !== "es"));
  return prefs;
}

export function createPageTranslator(root, { storage = globalThis.localStorage, getLanguage = () => readPreferences(storage).language || "es", onStatus = () => {} } = {}) {
  if (!root) return { translate: async () => {}, destroy: () => {} };
  const originals = new Map(), blocks = new Map(), attributes = new Map();
  const originalTitle = document.title;
  let version = 0, timer = 0, translating = false;

  function collect() {
    for (const block of root.querySelectorAll("[data-hero-line], [data-i18n-block]")) {
      block.dataset.i18nBlock = "";
      if (!blocks.has(block)) blocks.set(block, block.textContent.trim().replace(/\s+/g, " "));
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode(node) {
      const parent = node.parentElement;
      return parent && !parent.closest("script,style,[contenteditable='true'],[data-i18n-block]") && hasWords(node.nodeValue.trim()) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    } });
    let node; while ((node = walker.nextNode())) if (!originals.has(node)) originals.set(node, node.nodeValue);
    for (const element of root.querySelectorAll("[placeholder],[aria-label],[title],img[alt]")) if (!attributes.has(element)) {
      const values = {};
      for (const attribute of ATTRIBUTES) if (element.hasAttribute(attribute) && hasWords(element.getAttribute(attribute))) values[attribute] = element.getAttribute(attribute);
      attributes.set(element, values);
    }
    for (const collection of [originals, blocks, attributes]) for (const item of collection.keys()) if (!item.isConnected) collection.delete(item);
  }

  function getSources() {
    return [...new Set([...originals.values(), ...blocks.values(), originalTitle, ...[...attributes.values()].flatMap(values => Object.values(values))].map(value => String(value).trim()).filter(hasWords))];
  }

  function render(language, cache) {
    const dictionary = BASE_TRANSLATIONS[language] || {};
    const translated = source => dictionary[source] || cache[source] || source;
    for (const [node, spaced] of originals) { const source = spaced.trim(); node.nodeValue = spaced.replace(source, language === "es" ? source : translated(source)); }
    for (const [element, source] of blocks) { const next = language === "es" ? source : translated(source); if (element.textContent !== next) element.textContent = next; }
    for (const [element, values] of attributes) for (const [attribute, source] of Object.entries(values)) element.setAttribute(attribute, language === "es" ? source : translated(source));
    document.title = language === "es" ? originalTitle : translated(originalTitle);
  }

  async function translate() {
    if (translating) return;
    translating = true;
    const currentVersion = ++version;
    const language = getLanguage();
    document.documentElement.lang = language === "zh" ? "zh" : language;
    collect();
    if (language === "es") { render("es", {}); document.documentElement.classList.remove("translation-pending"); root.classList.remove("is-translating"); onStatus("complete", "Página en español."); translating = false; return; }
    const cache = readCache(storage, language);
    render(language, cache);
    document.documentElement.classList.remove("translation-pending");
    const dictionary = BASE_TRANSLATIONS[language] || {};
    const missing = getSources().filter(source => !dictionary[source] && !cache[source]);
    if (!missing.length) { onStatus("complete", "Traducción completa."); translating = false; return; }
    root.classList.add("is-translating"); onStatus("loading", "Traduciendo toda la página…");
    try {
      for (let index = 0; index < missing.length; index += 25) {
        const batch = missing.slice(index, index + 25);
        const response = await fetch("/api/translate", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ language, texts:batch }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No se pudo traducir la página.");
        batch.forEach((source, position) => { cache[source] = data.translations[position]; });
        storage?.setItem(`jobconnect.translations.${language}`, JSON.stringify(cache));
        if (currentVersion === version) render(language, cache);
      }
      if (currentVersion === version) onStatus("complete", "Traducción completa.");
    } catch (error) { if (currentVersion === version) onStatus("error", error.message); }
    finally { translating = false; if (currentVersion === version) root.classList.remove("is-translating"); }
  }

  const observer = new MutationObserver(() => { if (translating) return; clearTimeout(timer); timer = setTimeout(translate, 80); });
  observer.observe(root, { childList:true, subtree:true });
  return { translate, destroy() { clearTimeout(timer); observer.disconnect(); root.classList.remove("is-translating"); } };
}

export function applyStandaloneTranslation(root, storage = globalThis.localStorage) {
  applyEarlyPreferences(storage);
  const translator = createPageTranslator(root, { storage, onStatus(type, message) { if (type === "error") { const status = root.querySelector("[role='status']"); if (status) { status.textContent = message; status.classList.add("is-error"); } } } });
  translator.translate();
  return translator.destroy;
}

export function createPreferencesController(root, storage = globalThis.localStorage, feedback = null) {
  let prefs = { language:"es", vision:"default", lowPerformance:false, ...readPreferences(storage) };
  const topbar = root.querySelector(".topbar"); if (!topbar) return () => {};
  const controls = document.createElement("div"); controls.className = "global-preferences";
  controls.innerHTML = `<button type="button" data-pref-open aria-expanded="false">◉ <span>Accesibilidad</span></button><div class="preferences-popover" data-pref-panel hidden><label>Idioma<select data-pref-language><option value="es">Español</option><option value="en">English</option><option value="zh">中文</option></select></label><p class="translation-status" data-translation-status role="status"></p><label>Visión de color<select data-pref-vision><option value="default">Estándar</option><option value="protanopia">Protanopia</option><option value="deuteranopia">Deuteranopia</option><option value="tritanopia">Tritanopia</option><option value="achromatopsia">Acromatopsia</option></select></label><label class="performance-switch"><input type="checkbox" data-pref-performance><span>Modo bajo rendimiento</span></label></div>`;
  topbar.insertBefore(controls, topbar.querySelector("[data-theme-toggle]"));
  const panel=controls.querySelector("[data-pref-panel]"),opener=controls.querySelector("[data-pref-open]"),language=controls.querySelector("[data-pref-language]"),vision=controls.querySelector("[data-pref-vision]"),performance=controls.querySelector("[data-pref-performance]"),status=controls.querySelector("[data-translation-status]");
  language.value=prefs.language; vision.value=prefs.vision; performance.checked=prefs.lowPerformance;
  const translator=createPageTranslator(root,{storage,getLanguage:()=>prefs.language,onStatus(type,message){if(status.textContent!==message)status.textContent=message;if(type==="error")feedback?.error?.(message);}});
  function save(){document.documentElement.dataset.colorVision=prefs.vision;document.documentElement.classList.toggle("low-performance",prefs.lowPerformance);storage?.setItem(PREFS_KEY,JSON.stringify(prefs));}
  opener.addEventListener("click",()=>{panel.hidden=!panel.hidden;opener.setAttribute("aria-expanded",String(!panel.hidden));});
  language.addEventListener("change",()=>{prefs.language=language.value;save();translator.translate();});
  vision.addEventListener("change",()=>{prefs.vision=vision.value;save();});
  performance.addEventListener("change",()=>{prefs.lowPerformance=performance.checked;save();globalThis.location?.reload?.();});
  save(); translator.translate();
  return()=>{translator.destroy();controls.remove();};
}
