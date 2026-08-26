import assert from "node:assert/strict";
import test from "node:test";
import { canAccessModule, canManageModule, filterModulesForRole } from "../src/js/auth/access-control.js";

const modules = ["home", "candidates", "vacancies", "companies", "applications", "interviews", "tasks", "resumes"].map(id => ({ moduleMeta: { id } }));

test("el empleado solo accede a vacantes, empresas y currículums", () => {
  assert.deepEqual(filterModulesForRole(modules, "job-seeker").map(item => item.moduleMeta.id), ["home", "vacancies", "companies", "resumes"]);
  assert.equal(canManageModule("job-seeker", "vacancies"), false);
});

test("el empleador administra empresas y vacantes", () => {
  assert.equal(canManageModule("employer", "companies"), true);
  assert.equal(canManageModule("employer", "vacancies"), true);
  assert.equal(canAccessModule("employer", "candidates"), false);
});

test("el administrador accede y administra todos los módulos", () => {
  for (const module of modules) assert.equal(canAccessModule("admin", module.moduleMeta.id), true);
  assert.equal(canManageModule("admin", "tasks"), true);
});
