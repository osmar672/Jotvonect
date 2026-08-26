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

const ROLE_CONTEXT = Object.freeze({
  "job-seeker": "La persona es candidata. Ayúdala a buscar vacantes, mejorar su currículum y prepararse para entrevistas.",
  employer: "La persona es empleadora. Ayúdala a redactar vacantes inclusivas, definir requisitos y mejorar la contratación.",
  admin: "La persona administra JobConnect. Ayúdala con candidatos, empresas, vacantes, postulaciones, entrevistas y tareas."
});

async function handleAssistant(request, response) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
  if (!apiKey) return sendJson(response, 503, { error: "El asistente aún no está configurado. Define GEMINI_API_KEY al iniciar el servidor." });
  try {
    const body = await readJsonBody(request);
    const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
    if (!messages.length || messages.some(item => !["user", "model"].includes(item?.role) || typeof item?.text !== "string" || item.text.length > 4000)) return sendJson(response, 400, { error: "Envía una conversación válida." });
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `Eres Conecta, la asistente de IA de JobConnect. Responde únicamente consultas relacionadas con esta plataforma, empleo, currículums, vacantes, empresas, postulaciones, entrevistas y reclutamiento. Rechaza brevemente cualquier otro tema. Usa el idioma solicitado (${body.language || "es"}). Sé profesional, breve y práctico. No inventes datos ni tomes decisiones de contratación; evita discriminación y exige revisión humana en decisiones importantes. ${ROLE_CONTEXT[body.role] || ROLE_CONTEXT["job-seeker"]}` }] },
        contents: messages.map(item => ({ role: item.role, parts: [{ text: item.text.trim() }] })),
        generationConfig: { temperature: 0.5, maxOutputTokens: 700 }
      })
    });
    const data = await upstream.json();
    if (!upstream.ok) return sendJson(response, upstream.status, { error: data?.error?.message || "Gemini no pudo responder." });
    const answer = data?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
    if (!answer) throw new Error("Gemini devolvió una respuesta vacía.");
    sendJson(response, 200, { answer, model });
  } catch (error) { sendJson(response, 500, { error: error.message || "No se pudo consultar el asistente." }); }
}

async function handleTranslation(request, response) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
  if (!apiKey) return sendJson(response, 503, { error: "Define GEMINI_API_KEY para traducir toda la interfaz." });
  try {
    const body = await readJsonBody(request);
    const texts = Array.isArray(body.texts) ? body.texts : [];
    const targetName = body.language === "zh" ? "chino simplificado" : body.language === "en" ? "inglés" : null;
    if (!targetName || !texts.length || texts.length > 80 || texts.some(text => typeof text !== "string" || text.length > 1200)) return sendJson(response, 400, { error: "Solicitud de traducción inválida." });
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `Traduce textos de una interfaz de reclutamiento al ${targetName}. Conserva nombres propios, números, símbolos, HTML y siglas. Devuelve únicamente un arreglo JSON de cadenas, en el mismo orden y con exactamente la misma cantidad.` }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(texts) }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json", maxOutputTokens: 6000 }
      })
    });
    const data = await upstream.json();
    if (!upstream.ok) return sendJson(response, upstream.status, { error: data?.error?.message || "Gemini no pudo traducir la interfaz." });
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
  const server = createServer();

  server.listen(port, "127.0.0.1", () => {
    console.log(`JobConnect disponible en http://127.0.0.1:${port}`);
  });
}
