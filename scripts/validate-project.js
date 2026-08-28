import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import * as applications from "../src/js/modules/applications/index.js";
import * as candidates from "../src/js/modules/candidates/index.js";
import * as companies from "../src/js/modules/companies/index.js";
import * as home from "../src/js/modules/home/index.js";
import * as interviews from "../src/js/modules/interviews/index.js";
import * as tasks from "../src/js/modules/tasks/index.js";
import * as vacancies from "../src/js/modules/vacancies/index.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const modules = [candidates, vacancies, companies, applications, interviews, tasks];
const navigationModules = [home, ...modules];
const failures = [];
const successes = [];

function check(condition, message) {
  if (condition) successes.push(message);
  else failures.push(message);
}

function walk(directory) {
  return readdirSync(directory).flatMap(name => {
    const path = resolve(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const requiredFiles = [
  "index.html",
  "login.html",
  "server.js",
  "package.json",
  "package-lock.json",
  "README.md",
  "src/js/app.js",
  "src/js/core/api-client.js",
  "src/js/core/crud-module.js",
  "src/js/animations/interface-motion.js",
  "src/js/animations/home-motion.js",
  "src/js/modules/home/index.js",
  "src/js/profile/profile-service.js",
  "src/js/ui/profile-panel.js",
  "src/js/ui/theme-controller.js",
  "src/css/modules/home.css",
  "src/css/components/profile-panel.css",
  "src/js/auth/auth-service.js",
  "docs/planificacion/planificacion.md",
  "docs/reflexion/reflexion-final.md",
  "docs/bitacora/bitacora-notebooklm.md"
];

for (const relativePath of requiredFiles) {
  check(existsSync(resolve(projectRoot, relativePath)), `Existe ${relativePath}`);
}

const javascriptFiles = [
  resolve(projectRoot, "server.js"),
  ...walk(resolve(projectRoot, "src/js")).filter(path => extname(path) === ".js"),
  ...walk(resolve(projectRoot, "tests")).filter(path => extname(path) === ".js")
];

for (const file of javascriptFiles) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  check(result.status === 0, `Sintaxis válida: ${file.replace(`${projectRoot}/`, "")}`);
}

const cssFiles = walk(resolve(projectRoot, "src/css")).filter(path => extname(path) === ".css");

for (const file of cssFiles) {
  const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  let depth = 0;
  let valid = true;

  for (const character of css) {
    if (character === "{") depth += 1;
    if (character === "}") depth -= 1;
    if (depth < 0) valid = false;
  }

  check(valid && depth === 0, `Bloques CSS balanceados: ${file.replace(`${projectRoot}/`, "")}`);
}

for (const htmlName of ["index.html", "login.html"]) {
  const htmlPath = resolve(projectRoot, htmlName);
  const html = readFileSync(htmlPath, "utf8");
  check(/^<!doctype html>/i.test(html) && /<\/html>\s*$/i.test(html), `${htmlName} tiene una estructura HTML completa`);
  const references = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map(match => match[1])
    .filter(reference => !/^(?:https?:|#|data:)/.test(reference));

  for (const reference of references) {
    check(existsSync(resolve(projectRoot, reference)), `${htmlName} conecta ${reference}`);
  }
}

const ids = modules.map(module => module.moduleMeta.id);
const navigationIds = navigationModules.map(module => module.moduleMeta.id);
check(new Set(navigationIds).size === 7, "Inicio y los seis módulos tienen identificadores únicos");

const appSource = readFileSync(resolve(projectRoot, "src/js/app.js"), "utf8");
for (const moduleId of navigationIds) {
  check(appSource.includes(`./modules/${moduleId}/index.js`), `app.js importa el módulo ${moduleId}`);
}

check(appSource.includes("createProfileService") && appSource.includes("profileService"), "app.js conecta el perfil con la sesión y el shell");

for (const module of modules) {
  const config = module.moduleConfig;
  check(config.createPath.endsWith("/add"), `${module.moduleMeta.label} usa la ruta POST /add`);
  check(typeof module.mount === "function" && typeof module.unmount === "function", `${module.moduleMeta.label} expone mount y unmount`);
  check(config.updateMethods.every(method => ["put", "patch"].includes(method)), `${module.moduleMeta.label} declara métodos de edición válidos`);
}

check(candidates.moduleConfig.updateMethods.includes("put") && candidates.moduleConfig.updateMethods.includes("patch"), "Candidatos implementa PUT y PATCH");
check(vacancies.moduleConfig.updateMethods.includes("put") && vacancies.moduleConfig.updateMethods.includes("patch"), "Vacantes implementa PUT y PATCH");
check(typeof home.mount === "function" && typeof home.unmount === "function", "Inicio expone mount y unmount");

const homeSource = readFileSync(resolve(projectRoot, "src/js/modules/home/index.js"), "utf8");
const homeMotionSource = readFileSync(resolve(projectRoot, "src/js/animations/home-motion.js"), "utf8");
check(
  ["Eficiencia", "Modularidad", "Buenas prácticas", "Código claro", "Resolución de problemas"].every(term => homeSource.includes(term))
    && homeSource.includes("data-standards-explorer")
    && homeSource.includes('role="tablist"')
    && !homeSource.includes("home-metrics")
    && !homeSource.includes("home-marquee"),
  "Inicio presenta los estándares en un explorador interactivo y sin la franja de indicadores"
);
check(homeSource.includes("createLayout") && homeSource.includes("process-layout-dialog") && homeSource.includes("data-process-story"), "Inicio integra las etapas mediante expansión modal compartida");
check(!homeSource.includes("data-metaballs") && !homeMotionSource.includes("initMetaBalls"), "Inicio mantiene limpia la sección Somos JobConnect sin burbujas superpuestas");

const shellSource = readFileSync(resolve(projectRoot, "src/js/ui/shell.js"), "utf8");
const profilePanelSource = readFileSync(resolve(projectRoot, "src/js/ui/profile-panel.js"), "utf8");
const profileServiceSource = readFileSync(resolve(projectRoot, "src/js/profile/profile-service.js"), "utf8");
const crudSource = readFileSync(resolve(projectRoot, "src/js/core/crud-module.js"), "utf8");
check(shellSource.includes("data-open-navigation") && shellSource.includes("navigation-panel"), "La navegación se abre mediante un botón y un panel");
check(shellSource.includes("data-open-profile") && shellSource.includes("profile-panel"), "El botón del usuario abre el panel de perfil");
check(!shellSource.includes('class="sidebar"') && !shellSource.includes('class="logout"'), "El shell ya no contiene barra lateral fija ni cierre de sesión independiente");
check(profilePanelSource.includes("data-profile-logout") && profilePanelSource.includes("Cerrar sesión"), "Cerrar sesión está dentro del perfil");
check(["fullName", "country", "province", "desiredJob", "diplomas", "softSkills", "maxDistanceKm", "willingToRelocate"].every(field => profilePanelSource.includes(field)), "El perfil laboral incluye identidad, formación, habilidades y movilidad");
check(["job-seeker", "recruiter", "company"].every(type => profileServiceSource.includes(type)), "El perfil admite persona candidata, reclutador y empresa");
check(profileServiceSource.includes("localStorage") && profileServiceSource.includes("PROFILE_KEY_PREFIX"), "Las preferencias se conservan por cuenta en almacenamiento local");
check(profilePanelSource.includes("data-profile-completion") && profilePanelSource.includes("data-profile-preview"), "El perfil ofrece progreso, vista previa y actualización dinámica");
check(["data-view-mode", "data-form-panel", "entity-card--skeleton", "data-sort"].every(term => crudSource.includes(term)), "Los seis CRUD comparten vistas, ordenamiento, skeletons y editor lateral");
check(appSource.includes("createInterfaceMotion") && appSource.includes("transitionOut") && appSource.includes("transitionIn") && appSource.includes("createThemeController"), "La aplicación conecta transiciones entre módulos y tema persistente");

const packageJson = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf8"));
check(
  ["gsap", "lenis", "animejs"].every(name => packageJson.dependencies?.[name])
    && ["ScrollTrigger", "pointermove", "gsap.quickTo"].every(term => homeMotionSource.includes(term)),
  "Las bibliotecas y los efectos avanzados de scroll, puntero y movimiento continuo están conectados"
);

const frontendSource = walk(resolve(projectRoot, "src/js"))
  .filter(path => extname(path) === ".js")
  .map(path => readFileSync(path, "utf8"))
  .join("\n");
const feedbackSource = readFileSync(resolve(projectRoot, "src/js/core/feedback-service.js"), "utf8");
check(!/\b(?:window\.)?(?:alert|confirm|prompt)\s*\(/.test(frontendSource), "El frontend no utiliza alertas nativas del navegador");
check(/role=\"alertdialog\"/.test(feedbackSource) && /aria-modal=\"true\"/.test(feedbackSource), "La confirmación de borrado utiliza un modal accesible");

const readme = readFileSync(resolve(projectRoot, "README.md"), "utf8");
check(readme.length > 1500, "README contiene documentación completa");
check(/npm start/.test(readme) && /npm test/.test(readme), "README documenta ejecución y pruebas");

console.log(`Validaciones correctas: ${successes.length}`);
for (const message of successes) console.log(`  OK  ${message}`);

if (failures.length) {
  console.error(`\nValidaciones fallidas: ${failures.length}`);
  for (const message of failures) console.error(`  ERROR  ${message}`);
  process.exitCode = 1;
} else {
  console.log("\nResultado: estructura, navegación, perfiles, conexiones y matriz CRUD verificadas.");
}
