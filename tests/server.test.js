import assert from "node:assert/strict";
import test from "node:test";

import { createServer } from "../server.js";

async function startServer() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`
  };
}

test("el servidor Node responde health y publica todos los archivos principales", async t => {
  const { server, baseUrl } = await startServer();
  t.after(() => new Promise(resolve => server.close(resolve)));

  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok", application: "JobConnect" });

  for (const path of [
    "/",
    "/login.html",
    "/index.html",
    "/src/css/base.css",
    "/src/js/app.js",
    "/src/js/animations/interface-motion.js",
    "/src/js/animations/home-motion.js",
    "/src/js/ui/theme-controller.js",
    "/src/js/modules/candidates/index.js",
    "/node_modules/gsap/index.js",
    "/node_modules/gsap/ScrollTrigger.js",
    "/node_modules/gsap/gsap-core.js",
    "/node_modules/lenis/dist/lenis.mjs",
    "/node_modules/animejs/dist/modules/index.js"
  ]) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 200, `Se esperaba HTTP 200 para ${path}`);
  }

  const moduleResponse = await fetch(`${baseUrl}/node_modules/lenis/dist/lenis.mjs`);
  assert.match(moduleResponse.headers.get("content-type") || "", /^text\/javascript/);
});

test("el servidor Node devuelve errores controlados", async t => {
  const { server, baseUrl } = await startServer();
  t.after(() => new Promise(resolve => server.close(resolve)));

  const missing = await fetch(`${baseUrl}/archivo-inexistente.html`);
  assert.equal(missing.status, 404);

  const disallowedMethod = await fetch(`${baseUrl}/index.html`, { method: "POST" });
  assert.equal(disallowedMethod.status, 405);
});

test("el asistente conserva funcionalidad local cuando Gemini no está configurado", async t => {
  const previousKeys = { GEMINI_API_KEY: process.env.GEMINI_API_KEY, GOOGLE_API_KEY: process.env.GOOGLE_API_KEY, API_KEY: process.env.API_KEY };
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;
  delete process.env.API_KEY;
  const { server, baseUrl } = await startServer();
  t.after(() => {
    for (const [key, value] of Object.entries(previousKeys)) { if (value) process.env[key] = value; else delete process.env[key]; }
    return new Promise(resolve => server.close(resolve));
  });
  const response = await fetch(`${baseUrl}/api/assistant`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "job-seeker", messages: [{ role: "user", text: "Hola" }] }) });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.fallback, true);
  assert.equal(payload.model, "jobconnect-local");
  assert.match(payload.answer, /Gemini|contexto|JobConnect/i);

  const contextualResponse = await fetch(`${baseUrl}/api/assistant`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "job-seeker", language: "es", messages: [{ role: "user", text: "Quiero postularme como diseñador" }, { role: "model", text: "¿Qué experiencia tienes?" }, { role: "user", text: "Tengo tres años, ¿qué recomiendas según lo que te acabo de decir?" }] }) });
  const contextualPayload = await contextualResponse.json();
  assert.equal(contextualPayload.fallback, true);
  assert.match(contextualPayload.answer, /mensaje anterior|diseñador/i);
});

test("el servidor permite solicitudes API desde Live Server local", async t => {
  const { server, baseUrl } = await startServer();
  t.after(() => new Promise(resolve => server.close(resolve)));
  const response = await fetch(`${baseUrl}/api/assistant`, { method: "OPTIONS", headers: { Origin: "http://127.0.0.1:5500" } });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "http://127.0.0.1:5500");
});
