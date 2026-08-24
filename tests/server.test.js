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
