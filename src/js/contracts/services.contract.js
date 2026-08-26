/**
 * Contrato compartido de JobConnect.
 *
 * Servicios entregados a cada módulo:
 * - services.api: get, post, put, patch y remove.
 * - services.feedback: loading, success, error, clear y confirmDelete.
 * - services.navigate: cambia entre Inicio y los módulos de gestión.
 * - services.profile: get, save y reset para preferencias de la cuenta activa.
 *
 * Contrato obligatorio de un módulo:
 * - moduleMeta: { id, label, shortLabel }.
 * - moduleConfig: recurso, ruta de creación, campos y métodos permitidos.
 * - mount(container, services).
 * - unmount().
 *
 * La autenticación se resuelve en app.js antes de montar cualquier módulo.
 */

export const servicesContract = Object.freeze({
  apiMethods: ["get", "post", "put", "patch", "remove"],
  feedbackMethods: ["loading", "success", "error", "clear", "confirmDelete"],
  navigationMethods: ["navigate"],
  profileMethods: ["get", "save", "reset"],
  moduleExports: ["moduleMeta", "moduleConfig", "mount", "unmount"]
});
