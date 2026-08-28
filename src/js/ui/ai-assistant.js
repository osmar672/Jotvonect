const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));

const SUGGESTIONS = Object.freeze({
  "job-seeker": ["¿Cómo mejoro mi currículum?", "Ayúdame a buscar una vacante", "Prepárame para una entrevista"],
  employer: ["Redacta una vacante inclusiva", "¿Cómo registro mi empresa?", "¿Cómo evalúo candidatos objetivamente?"],
  admin: ["Resume las funciones del administrador", "¿Cómo interpreto el dashboard?", "Dame buenas prácticas de reclutamiento"]
});

const LOCAL_RESPONSES = Object.freeze({
  es: {
    outside: "Puedo responder preguntas generales, pero Gemini no está disponible en este momento. Inicia el servidor de JobConnect o revisa la cuota para recuperar respuestas completas y contextuales.",
    resume: "En JobConnect puedes guardar varios currículums. Al postularte, selecciona el que mejor se adapte a la vacante y destaca experiencia relevante, logros medibles y habilidades relacionadas.",
    vacancy: "Abre Vacantes para consultar oportunidades y empresas. Revisa requisitos y distancia; al postularte podrás elegir uno de tus currículums guardados.",
    interview: "Revisa la empresa y la vacante. Practica una presentación breve, ejemplos con situación–acción–resultado y dos preguntas para el entrevistador.",
    company: "Como empleador puedes registrar o editar una empresa en Empresas y publicar ofertas en Vacantes, incluyendo requisitos, ubicación y distancia.",
    hiring: "Usa criterios relacionados con el puesto, una rúbrica común y evidencias comparables. Evita datos discriminatorios y conserva revisión humana antes de decidir.",
    dashboard: "El administrador accede al dashboard, empresas, vacantes, candidatos, postulaciones, entrevistas y tareas. Los demás roles solo ven sus funciones autorizadas.",
    general: "Puedo orientarte sobre JobConnect, currículums, vacantes, postulaciones, entrevistas o reclutamiento. Cuéntame qué quieres lograr."
  },
  en: {
    outside: "I can only help with JobConnect, jobs, résumés, vacancies, companies, applications, interviews, and recruiting.", resume: "You can save multiple résumés in JobConnect. When applying, choose the version that best matches the vacancy and highlight relevant experience, measurable outcomes, and job-related skills.", vacancy: "Open Vacancies to review opportunities and companies. Check requirements and distance; when applying, choose one of your saved résumés.", interview: "Review the company and role, prepare a short introduction, practise situation–action–result examples, and bring two questions.", company: "Employers can register or edit a company under Companies and publish offers under Vacancies, including requirements, location, and distance.", hiring: "Use job-related criteria, one shared rubric, and comparable evidence. Avoid discriminatory information and keep a human reviewer in the final decision.", dashboard: "Administrators can access the dashboard, companies, vacancies, candidates, applications, interviews, and tasks. Other roles only see authorized functions.", general: "I can guide you through JobConnect, résumés, vacancies, applications, interviews, and recruiting. Tell me what you want to accomplish."
  },
  zh: {
    outside: "我只能协助处理 JobConnect、求职、简历、职位、公司、申请、面试和招聘相关问题。", resume: "你可以在 JobConnect 保存多份简历。申请职位时，请选择最符合要求的版本，并突出相关经验、可衡量成果和岗位技能。", vacancy: "打开“职位”查看机会和公司。确认要求与距离后，申请时可选择已保存的简历。", interview: "请了解公司和职位，准备简短自我介绍、情境—行动—结果示例，以及两个面试问题。", company: "雇主可在“公司”中登记或编辑企业，并在“职位”中发布工作机会、要求、地点和距离。", hiring: "请使用与岗位相关的统一标准和可比较证据，避免歧视性信息，并保留人工审核。", dashboard: "管理员可访问仪表板、公司、职位、候选人、申请、面试和任务；其他角色只能看到被授权的功能。", general: "我可以协助你使用 JobConnect，并解答简历、职位、申请、面试和招聘问题。"
  }
});

function localAnswer(conversation, language = "es") {
  const copy = LOCAL_RESPONSES[language] || LOCAL_RESPONSES.es;
  const userMessages = conversation.filter(item => item.role === "user").map(item => item.text);
  const question = userMessages.at(-1) || "";
  const previous = userMessages.at(-2) || "";
  const text = userMessages.slice(-4).join(" ").toLocaleLowerCase();
  const contextualize = answer => previous && /eso|anterior|acabo|dije|mencion|that|before|刚才|之前/i.test(question) ? `Tomando en cuenta tu mensaje anterior ("${previous.slice(0, 120)}"): ${answer}` : answer;
  if (/curr[ií]cul|resume|résumé|\bcv\b|简历/.test(text)) return contextualize(copy.resume);
  if (/vacan|oferta|puesto|postular|apply|vacanc|职位|申请/.test(text)) return contextualize(copy.vacancy);
  if (/entrevist|interview|面试/.test(text)) return contextualize(copy.interview);
  if (/empresa|company|employer|empleador|公司|雇主/.test(text)) return contextualize(copy.company);
  if (/evalu|contrat|reclut|candidate|candidat|招聘|候选/.test(text)) return contextualize(copy.hiring);
  if (/admin|dashboard|panel|m[oó]dulo|仪表板|管理员/.test(text)) return contextualize(copy.dashboard);
  if (!/jobconnect|trabaj|career|talent|emple|labor|job|recruit|求职|招聘|工作/.test(text)) return contextualize(copy.outside);
  return contextualize(copy.general);
}

const getApiUrl = path => ["5500", "5501"].includes(globalThis.location?.port) ? `http://127.0.0.1:3000${path}` : path;

async function readResponse(response) {
  const raw = await response.text();
  if (!raw.trim()) throw new Error(`El servidor respondió sin contenido (HTTP ${response.status}).`);
  try { return JSON.parse(raw); } catch { throw new Error(`El servidor devolvió una respuesta inválida (HTTP ${response.status}).`); }
}

export function createAiAssistant(root, { role = "job-seeker" } = {}) {
  const host = root?.querySelector?.(".app-shell") || root;
  if (!host) return () => {};
  let messages = [];
  let controller = null;
  const wrapper = document.createElement("div");
  const suggestions = SUGGESTIONS[role] || SUGGESTIONS["job-seeker"];
  wrapper.className = "ai-assistant";
  wrapper.innerHTML = `<button class="ai-assistant__launcher" type="button" data-ai-open aria-expanded="false" aria-controls="ai-assistant-panel"><span aria-hidden="true">✦</span> Asistente IA</button><aside id="ai-assistant-panel" class="ai-assistant__panel" aria-hidden="true" aria-label="Asistente de reclutamiento"><header><div><small data-ai-provider>GEMINI CON RESPALDO LOCAL</small><strong>Conecta</strong><p>Asistente especializado en JobConnect</p></div><div class="ai-assistant__header-actions"><button type="button" data-ai-reset aria-label="Nueva conversación" title="Nueva conversación">↻</button><button type="button" data-ai-close aria-label="Cerrar asistente">×</button></div></header><div class="ai-assistant__messages" data-ai-messages aria-live="polite"><div class="ai-message ai-message--model">Hola, soy Conecta. Puedo ayudarte con JobConnect, vacantes, empresas, currículums y reclutamiento.</div><div class="ai-suggestions">${suggestions.map(text => `<button type="button" data-ai-suggestion="${escapeHtml(text)}">${escapeHtml(text)}</button>`).join("")}</div></div><form data-ai-form><label class="sr-only" for="ai-question">Escribe tu consulta</label><textarea id="ai-question" data-ai-input rows="2" maxlength="4000" placeholder="Escribe tu consulta…" required></textarea><button class="btn btn--primary" type="submit">Enviar</button></form></aside>`;
  host.append(wrapper);
  const panel = wrapper.querySelector("[data-ai-close]").closest("aside");
  const launcher = wrapper.querySelector("[data-ai-open]");
  const form = wrapper.querySelector("[data-ai-form]");
  const submit = form.querySelector("button[type=submit]");
  const input = wrapper.querySelector("[data-ai-input]");
  const list = wrapper.querySelector("[data-ai-messages]");
  const provider = wrapper.querySelector("[data-ai-provider]");
  const closePanel = () => { panel.classList.remove("is-open"); panel.setAttribute("aria-hidden", "true"); launcher.setAttribute("aria-expanded", "false"); };
  const openPanel = () => { panel.classList.add("is-open"); panel.setAttribute("aria-hidden", "false"); launcher.setAttribute("aria-expanded", "true"); input.focus(); };
  const append = (text, type) => { const node = document.createElement("div"); node.className = `ai-message ai-message--${type}`; node.textContent = text; list.append(node); list.scrollTop = list.scrollHeight; return node; };
  async function ask(text) {
    const question = text.trim();
    if (!question || form.getAttribute("aria-busy") === "true") return;
    messages.push({ role: "user", text: question }); messages = messages.slice(-12);
    append(question, "user"); input.value = "";
    const pending = append("Pensando…", "pending");
    form.setAttribute("aria-busy", "true"); submit.disabled = true;
    let language = "es";
    try { language = JSON.parse(localStorage.getItem("jobconnect.accessibility") || "{}").language || "es"; } catch {}
    controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(getApiUrl("/api/assistant"), { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ role, language, messages }) });
      const data = await readResponse(response);
      if (!response.ok) throw new Error(data.error || `No se pudo obtener respuesta (HTTP ${response.status}).`);
      pending.remove(); messages.push({ role: "model", text: data.answer }); messages = messages.slice(-12); append(data.answer, "model");
      provider.textContent = data.fallback ? "RESPALDO LOCAL ACTIVO" : `IMPULSADO POR ${String(data.model || "GEMINI").toUpperCase()}`;
      provider.classList.toggle("is-fallback", Boolean(data.fallback));
    } catch {
      const answer = localAnswer(messages, language);
      pending.remove(); messages.push({ role: "model", text: answer }); append(answer, "model");
      append("Gemini no está disponible; esta respuesta usa la guía local segura de JobConnect.", "notice");
      provider.textContent = "RESPALDO LOCAL ACTIVO"; provider.classList.add("is-fallback");
    } finally {
      clearTimeout(timeout); controller = null; form.setAttribute("aria-busy", "false"); submit.disabled = false; input.focus();
    }
  }
  launcher.addEventListener("click", () => panel.classList.contains("is-open") ? closePanel() : openPanel());
  wrapper.querySelector("[data-ai-close]").addEventListener("click", closePanel);
  wrapper.querySelector("[data-ai-reset]").addEventListener("click", () => { messages = []; list.innerHTML = '<div class="ai-message ai-message--model">Nueva conversación iniciada. ¿En qué puedo ayudarte?</div>'; input.focus(); });
  form.addEventListener("submit", event => { event.preventDefault(); ask(input.value); });
  input.addEventListener("keydown", event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
  wrapper.addEventListener("click", event => { const button = event.target.closest("[data-ai-suggestion]"); if (button) { openPanel(); ask(button.dataset.aiSuggestion); } });
  const onKeyDown = event => { if (event.key === "Escape") closePanel(); };
  document.addEventListener("keydown", onKeyDown);
  return () => { controller?.abort(); document.removeEventListener("keydown", onKeyDown); wrapper.remove(); };
}
