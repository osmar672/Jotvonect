import assert from "node:assert/strict";
import test from "node:test";

import { login, getCurrentUser, getToken, isAuthenticated, logout, requireAuth } from "../src/js/auth/auth-service.js";
import { createApiClient } from "../src/js/core/api-client.js";

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function installLocalStorage() {
  const values = new Map();

  globalThis.localStorage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    clear: () => values.clear()
  };
}

test.beforeEach(() => {
  installLocalStorage();
});

test("login guarda el token y los datos del usuario", async () => {
  const requests = [];
  const mockFetch = async (url, options) => {
    requests.push({ url, options });
    return jsonResponse({
      id: 1,
      username: "emilys",
      firstName: "Emily",
      lastName: "Johnson",
      accessToken: "token-prueba"
    });
  };

  await login("emilys", "emilyspass", mockFetch);

  assert.equal(getToken(), "token-prueba");
  assert.equal(getCurrentUser().username, "emilys");
  assert.equal(isAuthenticated(), true);
  assert.equal(requests[0].url, "https://dummyjson.com/auth/login");
  assert.equal(requests[0].options.method, "POST");
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    username: "emilys",
    password: "emilyspass",
    expiresInMins: 60
  });
});

test("login muestra el mensaje devuelto por la API cuando las credenciales fallan", async () => {
  const mockFetch = async () => jsonResponse({ message: "Invalid credentials" }, 400);

  await assert.rejects(
    () => login("incorrecto", "incorrecto", mockFetch),
    /Invalid credentials/
  );
  assert.equal(isAuthenticated(), false);
});

test("login conserva el tipo de usuario seleccionado", async () => {
  const mockFetch = async () => jsonResponse({ id: 2, username: "empresa", accessToken: "token" });
  await login("empresa", "clave", mockFetch, "employer");
  assert.equal(getCurrentUser().accountType, "employer");
});

test("requireAuth bloquea el panel sin token y logout limpia la sesión", () => {
  let redirect = null;
  globalThis.window = { location: { replace: value => { redirect = value; } } };

  assert.equal(requireAuth(), false);
  assert.equal(redirect, "login.html");

  localStorage.setItem("jobconnect.token", "token");
  localStorage.setItem("jobconnect.user", "{}");
  assert.equal(requireAuth(), true);

  logout();
  assert.equal(getToken(), null);
  assert.equal(getCurrentUser(), null);
});

test("api-client conecta GET, POST, PUT, PATCH y DELETE con token Bearer", async () => {
  const calls = [];
  const mockFetch = async (url, options) => {
    calls.push({ url, ...options });
    return jsonResponse({ ok: true });
  };
  const api = createApiClient({ getToken: () => "abc123", fetchImplementation: mockFetch });

  await api.get("/users");
  await api.post("/users/add", { firstName: "Ana" });
  await api.put("/users/1", { firstName: "Ana" });
  await api.patch("/users/1", { phone: "8888" });
  await api.remove("/users/1");

  assert.deepEqual(calls.map(call => call.method || "GET"), ["GET", "POST", "PUT", "PATCH", "DELETE"]);
  assert.deepEqual(calls.map(call => call.url), [
    "https://dummyjson.com/users",
    "https://dummyjson.com/users/add",
    "https://dummyjson.com/users/1",
    "https://dummyjson.com/users/1",
    "https://dummyjson.com/users/1"
  ]);

  for (const call of calls) assert.equal(call.headers.Authorization, "Bearer abc123");
  assert.equal(calls[1].headers["Content-Type"], "application/json");
});

test("api-client normaliza errores HTTP sin romper la aplicación", async () => {
  const api = createApiClient({
    getToken: () => null,
    fetchImplementation: async () => jsonResponse({ message: "Registro no encontrado" }, 404)
  });

  await assert.rejects(() => api.get("/users/999"), /Registro no encontrado/);
});
