/**
 * @file Contratos públicos y congelados de JobConnect.
 * @description Este archivo documenta las interfaces compartidas. No contiene
 * lógica funcional y no debe modificarse después de fusionar la base.
 */

/**
 * Metadatos públicos de un módulo.
 *
 * @typedef {Object} ModuleMeta
 * @property {string} id Identificador oficial y único del módulo.
 * @property {string} label Nombre visible del módulo.
 */

/**
 * Contrato de exportación obligatorio para cada módulo funcional.
 * El módulo solo puede renderizar contenido dentro del `container` recibido.
 *
 * @typedef {Object} FeatureModule
 * @property {ModuleMeta} moduleMeta Metadatos públicos del módulo.
 * @property {function(HTMLElement, Services): Promise<void>} mount Monta el módulo en el contenedor recibido.
 * @property {function(): void} unmount Desmonta el módulo y libera sus recursos.
 *
 * @example
 * export const moduleMeta = {
 *   id: "identificador-unico",
 *   label: "Nombre visible"
 * };
 *
 * export async function mount(container, services) {}
 * export function unmount() {}
 */

/**
 * Operaciones HTTP disponibles para los módulos.
 * Todas las rutas son relativas a la API base https://dummyjson.com.
 *
 * @typedef {Object} ApiService
 * @property {function(string): Promise<unknown>} get Ejecuta una solicitud GET.
 * @property {function(string, unknown): Promise<unknown>} post Ejecuta una solicitud POST.
 * @property {function(string, unknown): Promise<unknown>} put Ejecuta una solicitud PUT.
 * @property {function(string, unknown): Promise<unknown>} patch Ejecuta una solicitud PATCH.
 * @property {function(string): Promise<unknown>} remove Ejecuta una solicitud DELETE.
 */

/**
 * Mensajes y confirmaciones compartidos de la interfaz.
 *
 * @typedef {Object} FeedbackService
 * @property {function(string): void} loading Muestra un estado de carga.
 * @property {function(string): void} success Muestra un mensaje de éxito.
 * @property {function(string): void} error Muestra un mensaje de error.
 * @property {function(): void} clear Limpia el feedback actual.
 * @property {function(string): Promise<boolean>} confirmDelete Solicita confirmación y resuelve con la decisión del usuario.
 */

/**
 * Operaciones de sesión expuestas a los módulos mediante `services.auth`.
 *
 * @typedef {Object} ServicesAuth
 * @property {function(): (string|null)} getToken Obtiene el token de sesión actual.
 * @property {function(): boolean} isAuthenticated Indica si existe una sesión activa.
 * @property {function(): void} logout Cierra la sesión actual.
 */

/**
 * Servicios compartidos que recibe cada módulo en `mount`.
 *
 * @typedef {Object} Services
 * @property {ApiService} api Cliente HTTP compartido.
 * @property {FeedbackService} feedback Servicio compartido de feedback.
 * @property {ServicesAuth} auth Acceso controlado al estado de autenticación.
 *
 * @example
 * services.api.get(path)
 * services.api.post(path, data)
 * services.api.put(path, data)
 * services.api.patch(path, data)
 * services.api.remove(path)
 *
 * services.feedback.loading(message)
 * services.feedback.success(message)
 * services.feedback.error(message)
 * services.feedback.clear()
 * services.feedback.confirmDelete(message) // Promise<boolean>
 *
 * services.auth.getToken()
 * services.auth.isAuthenticated()
 * services.auth.logout()
 */

/**
 * Contrato de exportación del servicio de autenticación.
 * `requireAuth` devuelve `true` cuando hay sesión. Cuando no existe una sesión,
 * redirige a `login.html` y devuelve `false`.
 *
 * @typedef {Object} AuthService
 * @property {function(string, string): Promise<unknown>} login Inicia sesión con usuario y contraseña.
 * @property {function(): (string|null)} getToken Obtiene el token actual.
 * @property {function(): (unknown|null)} getCurrentUser Obtiene el usuario actual.
 * @property {function(): boolean} isAuthenticated Indica si hay una sesión activa.
 * @property {function(): boolean} requireAuth Protege la interfaz principal.
 * @property {function(): void} logout Cierra la sesión.
 *
 * @example
 * export async function login(username, password) {}
 * export function getToken() {}
 * export function getCurrentUser() {}
 * export function isAuthenticated() {}
 * export function requireAuth() {}
 * export function logout() {}
 */

/**
 * Configuración recibida por la interfaz principal.
 *
 * @typedef {Object} ShellOptions
 * @property {HTMLElement} root Elemento raíz de la interfaz.
 * @property {FeatureModule[]} modules Los seis módulos registrados por `app.js`.
 * @property {function(string): (void|Promise<void>)} onSelect Callback de selección de módulo.
 * @property {function(): (void|Promise<void>)} onLogout Callback de cierre de sesión.
 */

/**
 * Resultado de renderizar la interfaz principal.
 *
 * @typedef {Object} ShellResult
 * @property {HTMLElement} contentContainer Contenedor exclusivo para montar módulos.
 */

/**
 * Contrato de exportación de la interfaz principal.
 *
 * @typedef {Object} ShellService
 * @property {function(ShellOptions): ShellResult} renderShell Renderiza la estructura principal.
 *
 * @example
 * export function renderShell({ root, modules, onSelect, onLogout }) {
 *   return {
 *     contentContainer
 *   };
 * }
 */
