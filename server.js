import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { dirname, extname, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

function loadEnvironmentFile() {
  const envPath = resolve(projectRoot, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}
loadEnvironmentFile();

const mimeTypes = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
});

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store"
  });
  response.end(body);
}

function readJsonBody(request, limit = 50_000) {
  return new Promise((resolveBody, reject) => {
    let raw = "";
    request.setEncoding("utf8");
    request.on("data", chunk => {
      raw += chunk;
      if (raw.length > limit) reject(new Error("La solicitud es demasiado grande."));
    });
    request.on("end", () => {
      try { resolveBody(JSON.parse(raw || "{}")); } catch { reject(new Error("El contenido JSON no es válido.")); }
    });
    request.on("error", reject);
  });
}

async function readUpstreamJson(response, serviceName) {
  const raw = await response.text();
  if (!raw.trim()) throw new Error(`${serviceName} devolvió una respuesta vacía.`);
  try { return JSON.parse(raw); }
  catch { throw new Error(`${serviceName} devolvió una respuesta inválida.`); }
}

const ROLE_CONTEXT = Object.freeze({
  "job-seeker": "La persona es candidata. Solo puede consultar vacantes y empresas, administrar varios currículums y elegir uno al postularse.",
  employer: "La persona es empleadora. Puede registrar su empresa y crear o editar vacantes, incluida su distancia.",
  admin: "La persona administra JobConnect. Tiene acceso al dashboard y a candidatos, empresas, vacantes, postulaciones, entrevistas y tareas."
});

function buildLocalAssistantAnswer(messages, role, language = "es") {
  const texts = {
    es: {
      outside: "Puedo responder preguntas generales, pero Gemini no está disponible en este momento. Cuando vuelva a estar disponible podré desarrollar esta respuesta con mayor precisión y conservar plenamente el contexto.",
      resume: "Puedes guardar varios currículums en el módulo Currículums. Al postularte, elige el que mejor coincida con la vacante; destaca experiencia relevante, resultados medibles y habilidades relacionadas.",
      vacancy: role === "employer" ? "Desde Vacantes puedes crear o editar una oferta y definir requisitos, ubicación y distancia. Usa criterios claros, inclusivos y relacionados con el puesto." : "Consulta Vacantes, revisa requisitos, empresa y distancia. Al postularte podrás seleccionar uno de tus currículums guardados.",
      company: role === "employer" ? "Registra o actualiza tu organización en Empresas. Después podrás asociarla con ofertas publicadas desde Vacantes." : "En Empresas puedes consultar la información de las organizaciones vinculadas con las vacantes disponibles.",
      interview: "Revisa la empresa y la vacante, prepara una presentación breve, ejemplos con situación–acción–resultado y dos preguntas para la entrevista.",
      dashboard: role === "admin" ? "El dashboard administrativo resume la actividad general. Además tienes acceso a empresas, vacantes, candidatos, postulaciones, entrevistas y tareas." : "El dashboard general está reservado al administrador; tu menú muestra únicamente las funciones autorizadas para tu rol.",
      general: "Puedo orientarte sobre JobConnect, currículums, vacantes, empresas, postulaciones, entrevistas y procesos de reclutamiento. Indícame qué quieres lograr."
    },
    en: { outside: "I can answer general questions, but Gemini is currently unavailable. Once it is available again I can develop this answer more precisely and preserve the full context.", resume: "Save multiple résumés under Résumés. When applying, choose the one that best matches the vacancy and highlight relevant experience, measurable results, and related skills.", vacancy: role === "employer" ? "Under Vacancies you can create or edit an offer and define its requirements, location, and distance." : "Review the requirements, company, and distance under Vacancies. When applying, choose one of your saved résumés.", company: role === "employer" ? "Register or update your organization under Companies, then associate it with offers published under Vacancies." : "Companies shows information about organizations linked to available vacancies.", interview: "Review the company and role, prepare a short introduction, situation–action–result examples, and two interview questions.", dashboard: role === "admin" ? "The admin dashboard summarizes overall activity and provides access to companies, vacancies, candidates, applications, interviews, and tasks." : "The general dashboard is reserved for administrators; your menu only shows functions authorized for your role.", general: "I can guide you through JobConnect, résumés, vacancies, companies, applications, interviews, and recruiting." },
    zh: { outside: "我可以回答一般问题，但 Gemini 目前不可用。恢复后，我可以更准确地展开回答并完整保留对话上下文。", resume: "你可以保存多份简历。申请职位时，请选择最符合要求的版本，并突出相关经验、可衡量成果和技能。", vacancy: role === "employer" ? "你可以在“职位”中创建或编辑工作机会，并设置要求、地点和距离。" : "请在“职位”中查看要求、公司和距离；申请时可选择已保存的简历。", company: role === "employer" ? "请在“公司”中登记或更新企业，然后将其关联到职位。" : "“公司”页面提供与职位相关的企业信息。", interview: "请了解公司和职位，准备简短自我介绍、情境—行动—结果示例和两个问题。", dashboard: role === "admin" ? "管理员仪表板汇总整体活动，并可访问公司、职位、候选人、申请、面试和任务。" : "综合仪表板仅限管理员；你的菜单只显示角色获准使用的功能。", general: "我可以协助你使用 JobConnect，并解答简历、职位、公司、申请、面试和招聘问题。" }
  };
  const copy = texts[language] || texts.es;
  const conversation = Array.isArray(messages) ? messages : [];
  const userMessages = conversation.filter(item => item?.role === "user").map(item => item.text.trim());
  const question = userMessages.at(-1) || "";
  const normalized = userMessages.slice(-4).join(" ").toLocaleLowerCase();
  const previous = userMessages.length > 1 ? userMessages.at(-2) : "";
  const contextualize = answer => previous && /eso|anterior|acabo|dije|mencion|that|before|刚才|之前/i.test(question)
    ? `${language === "en" ? "Taking your previous message into account" : language === "zh" ? "结合你上一条消息" : "Tomando en cuenta tu mensaje anterior"} (\"${previous.slice(0, 120)}\"): ${answer}`
    : answer;
  if (/curr[ií]cul|resume|résumé|\bcv\b|简历/.test(normalized)) return contextualize(copy.resume);
  if (/vacan|oferta|puesto|postular|apply|vacanc|职位|申请/.test(normalized)) return contextualize(copy.vacancy);
  if (/empresa|company|employer|empleador|公司|雇主/.test(normalized)) return contextualize(copy.company);
  if (/entrevist|interview|面试/.test(normalized)) return contextualize(copy.interview);
  if (/admin|dashboard|panel|仪表板|管理员/.test(normalized)) return contextualize(copy.dashboard);
  if (!/jobconnect|emple|trabaj|talent|career|reclut|job|求职|招聘|工作/.test(normalized)) return contextualize(copy.outside);
  return contextualize(copy.general);
}

async function handleAssistant(request, response) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
  let body = {};
  let messages = [];
  try {
    body = await readJsonBody(request);
    messages = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
    if (!messages.length || messages.some(item => !["user", "model"].includes(item?.role) || typeof item?.text !== "string" || item.text.length > 4000)) return sendJson(response, 400, { error: "Envía una conversación válida." });
    const fallback = reason => sendJson(response, 200, { answer: buildLocalAssistantAnswer(messages, body.role, body.language), model: "jobconnect-local", fallback: true, fallbackReason: reason });
    if (!apiKey) return fallback();
    const configuredModels = [process.env.GEMINI_MODEL || "gemini-3.6-flash", ...(process.env.GEMINI_FALLBACK_MODELS || "gemini-3.5-flash-lite,gemini-flash-lite-latest").split(",")];
    const models = [...new Set(configuredModels.map(model => model.trim()).filter(Boolean))];
    let lastStatus = 503;
    for (const model of models) {
      try {
        const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey }, signal: AbortSignal.timeout(7000),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: `Eres Conecta, la asistente conversacional de JobConnect. Responde la pregunta actual usando activamente todos los mensajes anteriores; entiende referencias como "eso", "lo anterior" o "lo que te dije". Puedes responder preguntas generales, pero prioriza orientación útil sobre empleo y la plataforma. No repitas respuestas prefabricadas. No afirmes haber realizado acciones en la plataforma. Los permisos reales dependen del rol: ${ROLE_CONTEXT[body.role] || ROLE_CONTEXT["job-seeker"]} Usa el idioma solicitado (${body.language || "es"}). Sé claro, natural y práctico. En contratación evita discriminación y no sustituyas la decisión humana.` }] },
            contents: messages.map(item => ({ role: item.role, parts: [{ text: item.text.trim() }] })),
            generationConfig: { temperature: 0.65, maxOutputTokens: 900 }
          })
        });
        const data = await readUpstreamJson(upstream, "Gemini");
        lastStatus = upstream.status;
        if (!upstream.ok) continue;
        const answer = data?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
        if (answer) return sendJson(response, 200, { answer, model });
      } catch (error) {
        lastStatus = error?.name === "TimeoutError" ? 408 : 503;
      }
    }
    return fallback(`gemini-http-${lastStatus}`);
  } catch (error) {
    try {
      const message = error?.message || "";
      if (/JSON|solicitud|conversación|grande/i.test(message)) return sendJson(response, 400, { error: message });
      sendJson(response, 200, { answer: buildLocalAssistantAnswer(messages, body.role, body.language), model: "jobconnect-local", fallback: true, fallbackReason: error?.name === "TimeoutError" ? "timeout" : "connection" });
    } catch { sendJson(response, 500, { error: "No se pudo consultar el asistente." }); }
  }
}

async function handleTranslation(request, response) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
  if (!apiKey) return sendJson(response, 503, { error: "Define GEMINI_API_KEY para traducir toda la interfaz." });
  try {
    const body = await readJsonBody(request);
    const texts = Array.isArray(body.texts) ? body.texts : [];
    const targetName = body.language === "zh" ? "chino simplificado" : body.language === "en" ? "inglés" : null;
    if (!targetName || !texts.length || texts.length > 80 || texts.some(text => typeof text !== "string" || text.length > 1200)) return sendJson(response, 400, { error: "Solicitud de traducción inválida." });
    const model = process.env.GEMINI_TRANSLATION_MODEL || "gemini-3.6-flash";
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `Traduce textos de una interfaz de reclutamiento al ${targetName}. Conserva nombres propios, números, símbolos, HTML y siglas. Devuelve únicamente un arreglo JSON de cadenas, en el mismo orden y con exactamente la misma cantidad.` }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(texts) }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json", maxOutputTokens: 6000 }
      })
    });
    const data = await readUpstreamJson(upstream, "Gemini");
    if (!upstream.ok) {
      const messages = {
        405: "El modelo configurado no admite traducciones. Usa GEMINI_TRANSLATION_MODEL=gemini-3.6-flash.",
        429: "Se alcanzó temporalmente el límite de traducciones de Gemini. Intenta nuevamente en unos segundos."
      };
      return sendJson(response, upstream.status, { error: messages[upstream.status] || data?.error?.message || "Gemini no pudo traducir la interfaz." });
    }
    const raw = data?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("") || "[]";
    const translations = JSON.parse(raw);
    if (!Array.isArray(translations) || translations.length !== texts.length) throw new Error("Gemini devolvió una traducción incompleta.");
    sendJson(response, 200, { translations });
  } catch (error) { sendJson(response, 500, { error: error.message || "No se pudo traducir la interfaz." }); }
}

function resolvePublicPath(requestPath) {
  let decodedPath;

  try {
    decodedPath = decodeURIComponent(requestPath);
  } catch {
    return null;
  }

  const relativePath = decodedPath === "/" ? "login.html" : decodedPath.replace(/^\/+/, "");
  const normalizedPath = normalize(relativePath);

  if (normalizedPath.split(sep).some(segment => segment.startsWith("."))) return null;

  const absolutePath = resolve(projectRoot, normalizedPath);
  if (absolutePath !== projectRoot && !absolutePath.startsWith(`${projectRoot}${sep}`)) return null;

  return absolutePath;
}

export function createServer() {
  return createHttpServer(async (request, response) => {
    const method = request.method || "GET";
    const requestUrl = new URL(request.url || "/", "http://localhost");

    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "no-referrer");

    const origin = request.headers.origin || "";
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.setHeader("Vary", "Origin");
      response.setHeader("Access-Control-Allow-Headers", "Content-Type");
      response.setHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
    }
    if (method === "OPTIONS") { response.writeHead(204); response.end(); return; }

    if (requestUrl.pathname === "/health") {
      if (method !== "GET" && method !== "HEAD") {
        sendJson(response, 405, { error: "Método no permitido." });
        return;
      }

      sendJson(response, 200, { status: "ok", application: "JobConnect" });
      return;
    }

    if (requestUrl.pathname === "/api/assistant") {
      if (method !== "POST") return sendJson(response, 405, { error: "Método no permitido." });
      await handleAssistant(request, response);
      return;
    }

    if (requestUrl.pathname === "/api/translate") {
      if (method !== "POST") return sendJson(response, 405, { error: "Método no permitido." });
      await handleTranslation(request, response);
      return;
    }

    if (method !== "GET" && method !== "HEAD") {
      sendJson(response, 405, { error: "Método no permitido." });
      return;
    }

    const filePath = resolvePublicPath(requestUrl.pathname);

    if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
      sendJson(response, 404, { error: "Recurso no encontrado." });
      return;
    }

    const extension = extname(filePath).toLowerCase();
    const contentType = mimeTypes[extension] || "application/octet-stream";
    const stats = statSync(filePath);

    response.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stats.size,
      "Cache-Control": "no-store"
    });

    if (method === "HEAD") {
      response.end();
      return;
    }

    const stream = createReadStream(filePath);
    stream.on("error", () => {
      if (!response.headersSent) sendJson(response, 500, { error: "No se pudo leer el recurso." });
      else response.destroy();
    });
    stream.pipe(response);
  });
}

const isDirectExecution = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const parsedPort = Number(process.env.JOBCONNECT_PORT || 3000);
  const port = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort <= 65535 ? parsedPort : 3000;
  const host = process.env.JOBCONNECT_HOST || "127.0.0.1";
  const server = createServer();

  server.on("error", error => {
    if (error.code === "EADDRINUSE") {
      console.error(`No se pudo iniciar JobConnect: el puerto ${port} ya está ocupado. Usa JOBCONNECT_PORT=3001 npm start.`);
    } else if (error.code === "EACCES" || error.code === "EPERM") {
      console.error(`No se pudo abrir http://${host}:${port}. Revisa los permisos de red local de Node.js o usa otro puerto.`);
    } else {
      console.error("No se pudo iniciar JobConnect:", error.message);
    }
    process.exitCode = 1;
  });

  server.listen(port, host, () => {
    const publicHost = host === "0.0.0.0" ? "localhost" : host;
    console.log(`JobConnect disponible en http://${publicHost}:${port}`);
  });
}
