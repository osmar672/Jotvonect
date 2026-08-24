import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { dirname, extname, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

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
  return createHttpServer((request, response) => {
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
      "Cache-Control": extension === ".html" ? "no-store" : "public, max-age=300"
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
