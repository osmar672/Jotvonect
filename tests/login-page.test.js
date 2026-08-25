import assert from "node:assert/strict";
import test from "node:test";

// Evita ejecutar la inicialización de la página al importar el módulo.
globalThis.localStorage = { getItem: () => "token" };
globalThis.window = { location: { replace() {} } };

const { DEMO_CREDENTIALS_BY_ROLE } = await import("../src/js/auth/login-page.js");

test("cada opción de usuario tiene credenciales automáticas", () => {
  for (const role of ["job-seeker", "employer", "admin"]) {
    assert.ok(DEMO_CREDENTIALS_BY_ROLE[role].username);
    assert.ok(DEMO_CREDENTIALS_BY_ROLE[role].password);
  }
});
