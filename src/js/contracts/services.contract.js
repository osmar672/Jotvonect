/**
 * Contrato congelado de servicios de JobConnect.
 * Los módulos dependen de esta forma y no conocen la implementación.
 *
 * services.api: get, post, put, patch, remove
 * services.feedback: loading, success, error, clear, confirmDelete
 * services.auth: getToken, isAuthenticated, logout
 *
 * module contract:
 * export const moduleMeta = { id, label }
 * export async function mount(container, services)
 * export function unmount()
 */