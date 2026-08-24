# Prompt del Integrante 2 — Equipo de dos

## Interfaz, servicios comunes, integración, vacantes, empresas, postulaciones, repositorio, README, video y bitácora

Usar después de que el Prompt 0 esté fusionado con main. La integración final de los seis módulos se completa cuando el Pull Request del Integrante 1 ya esté en main.

---

## Prompt para el agente de código

Actúa como desarrollador e integrador de JobConnect. Implementa de principio a fin:

- Interfaz principal y navegación.
- Diseño responsivo.
- Cliente API.
- Feedback y errores.
- Vacantes.
- Empresas clientes.
- Postulaciones.
- Integración de los seis módulos.
- Administración técnica del repositorio.
- README.
- Material del video.
- Bitácora de NotebookLM.

Trabaja únicamente en:

    feature/i2-ui-core-vacantes-empresas-postulaciones

Antes de modificar:

1. Lee docs/arquitectura/propiedad-archivos.md.
2. Lee src/js/contracts/services.contract.js.
3. Revisa el repositorio.
4. Confirma que tu rama parte del main actualizado.

## Archivos autorizados

Solo puedes crear o modificar:

- index.html
- README.md
- src/js/app.js
- src/js/config/**
- src/js/core/**
- src/js/ui/**
- src/js/modules/vacancies/**
- src/js/modules/companies/**
- src/js/modules/applications/**
- src/css/base.css
- src/css/layout.css
- src/css/responsive.css
- src/css/components/feedback.css
- src/css/modules/vacancies.css
- src/css/modules/companies.css
- src/css/modules/applications.css
- docs/video/**
- docs/bitacora/**
- docs/integracion/**
- docs/notebooklm/integrante-2/**
- docs/pruebas/integrante-2.md

No puedes modificar:

- login.html
- src/js/contracts/**
- src/js/auth/**
- Los módulos candidates, interviews o tasks.
- auth.css, candidates.css, interviews.css o tasks.css.
- Planificación, infografía o reflexión.

Si una integración requiere adaptar el componente del Integrante 1, crea el adaptador dentro de app.js o src/js/core/. No cambies su implementación.

## 1. Interfaz principal

Completa index.html manteniendo:

- id app.
- id feedback-root.
- src/js/app.js como script type=module.
- HTML semántico.
- Navegación accesible.

Incluir los estilos en este orden:

1. src/css/base.css
2. src/css/layout.css
3. src/css/components/feedback.css
4. src/css/modules/candidates.css
5. src/css/modules/interviews.css
6. src/css/modules/tasks.css
7. src/css/modules/vacancies.css
8. src/css/modules/companies.css
9. src/css/modules/applications.css
10. src/css/responsive.css

Puedes enlazar los CSS del Integrante 1, pero no modificarlos.

La interfaz debe incluir:

- Encabezado JobConnect.
- Menú para seis módulos.
- Área principal.
- Usuario actual.
- Logout.
- Navegación por teclado.
- Vista en computadora, tablet y teléfono.

## 2. Shell

Crear src/js/ui/shell.js y exportar exactamente:

    export function renderShell({
      root,
      modules,
      onSelect,
      onLogout
    }) {}

Debe:

- Recibir la lista de módulos.
- Crear navegación sin importar módulos CRUD.
- Ejecutar onSelect(id).
- Ejecutar onLogout().
- Devolver { contentContainer }.
- No implementar autenticación ni peticiones.

## 3. CSS global

### base.css

Definir:

- Variables de color.
- Tipografía.
- Espaciados.
- Bordes.
- Sombras.
- Estados de foco.
- Estilos generales de formularios, botones, tablas y tarjetas.

Este es el único CSS autorizado para selectores globales.

### layout.css

Definir:

- Encabezado.
- Navegación.
- Área de contenido.
- Distribución del panel.

### responsive.css

Definir ajustes para:

- Computadora.
- Tablet.
- Teléfono.

No ocultar acciones necesarias.

## 4. Configuración y cliente API

Crear src/js/config/api-config.js con:

    baseUrl: "https://dummyjson.com"

Crear src/js/core/api-client.js y exportar:

    createApiClient({ getToken })

El objeto devuelto implementa:

    get(path)
    post(path, data)
    put(path, data)
    patch(path, data)
    remove(path)

Requisitos:

- fetch.
- async/await.
- try/catch.
- Content-Type application/json.
- Authorization Bearer cuando exista token.
- Manejo de respuestas HTTP no exitosas.
- Errores normalizados.
- Sin manipular directamente la interfaz.

## 5. Feedback y errores

Crear dentro de src/js/core/:

- feedback-service.js
- error-normalizer.js
- delete-confirmation.js, si se necesita.

Respetar:

    loading(message)
    success(message)
    error(message)
    clear()
    confirmDelete(message)

Requisitos:

- Renderizar en #feedback-root.
- aria-live para mensajes.
- Confirmación antes de DELETE.
- No usar alert para éxito o error normal.
- No bloquear toda la aplicación.
- Limpiar mensajes anteriores.

Usar src/css/components/feedback.css.

## 6. Contrato de módulos

Los tres módulos propios exportan:

    export const moduleMeta = {
      id: "id-oficial",
      label: "Nombre visible"
    };

    export async function mount(container, services) {}
    export function unmount() {}

Reglas:

- Trabajar dentro del container.
- Consumir services.api y services.feedback.
- Validar formularios.
- Mostrar carga, error y lista vacía.
- Confirmar eliminaciones.
- Actualizar estado local tras mutaciones.
- Limpiar listeners en unmount.
- No crear variables globales.

## 7. Vacantes completo

Endpoint:

    /products

Identificador:

    vacancies

Métodos:

- GET.
- POST.
- PUT.
- PATCH.
- DELETE.

Campos sugeridos:

- title
- description
- category
- price, mostrado como referencia salarial.

Ubicación:

    src/js/modules/vacancies/

Metadatos:

    id: "vacancies"
    label: "Vacantes"

## 8. Empresas clientes completo

Endpoint:

    /carts

Identificador:

    companies

Métodos:

- GET.
- POST.
- PUT.
- DELETE.

Presentar carts como empresas clientes sin cambiar el endpoint.

Ubicación:

    src/js/modules/companies/

Metadatos:

    id: "companies"
    label: "Empresas clientes"

## 9. Postulaciones completo

Endpoint:

    /posts

Identificador:

    applications

Métodos:

- GET.
- POST.
- PATCH.
- DELETE.

Campos mínimos:

- title
- body
- userId

Ubicación:

    src/js/modules/applications/

Metadatos:

    id: "applications"
    label: "Postulaciones"

## 10. Estilos de módulos

- vacancies.css bajo .module--vacancies.
- companies.css bajo .module--companies.
- applications.css bajo .module--applications.
- No utilizar selectores globales en esos archivos.
- No modificar CSS del Integrante 1.

## 11. Integración desde app.js

Después de fusionar el Pull Request del Integrante 1:

1. Importa auth-service.js.
2. Importa createApiClient.
3. Crea feedback.
4. Importa renderShell.
5. Importa los seis módulos.
6. Ejecuta requireAuth.
7. Crea un único arreglo de módulos.
8. Pasa el mismo objeto services a cada módulo.
9. Desmonta el módulo anterior.
10. Monta el seleccionado en contentContainer.
11. Conecta logout.
12. Controla errores de montaje.

Orden:

    candidates
    vacancies
    companies
    applications
    interviews
    tasks

No copies lógica del Integrante 1. Solo importa y compone.

Si sus archivos aún no existen:

- No crees módulos falsos.
- Registra el pendiente.
- Completa imports después del merge.

## 12. README

Crear README.md con:

- Descripción.
- Objetivo.
- Tecnologías.
- Estructura.
- Ejecución mediante servidor local.
- Credenciales de prueba de DummyJSON.
- Autenticación.
- Seis módulos y métodos.
- Estado local.
- División entre dos integrantes.
- Ramas y Pull Requests.
- Uso.
- Entregables.
- Enlaces finales.

## 13. Video

Crear:

### docs/video/guion-video.md

Guion para:

- Presentación.
- Login.
- Navegación.
- Seis módulos.
- CRUDs.
- Feedback.
- Responsividad.
- Repositorio.
- Conclusión.

### docs/video/lista-grabacion.md

Checklist de audio, resolución, duración, demostración y revisión.

### docs/video/enlace-video.md

Espacio para el enlace o nombre del video final.

## 14. Bitácora

Crear docs/bitacora/bitacora-notebooklm.md.

Cada entrada incluye:

- Fecha.
- Integrante.
- Pregunta.
- Respuesta resumida.
- Aplicación.
- Resultado.

Recopilar las evidencias del Integrante 1 y las propias.

## 15. NotebookLM y pruebas

Crear docs/notebooklm/integrante-2/consultas.md sobre:

- Arquitectura.
- Navegación.
- Responsividad.
- Errores.
- CORS.
- Git.
- README.
- Video Overview.

Crear docs/pruebas/integrante-2.md con:

- Navegación.
- Feedback.
- Errores de red.
- Cinco operaciones de vacantes.
- Cuatro operaciones de empresas.
- Cuatro operaciones de postulaciones.
- Login y logout integrados.
- Seis módulos.
- Estado local.
- Computadora, tablet y teléfono.
- Consola sin errores.
- Integración Git.

## 16. Git e integración

Antes de integrar al Integrante 1:

    git fetch origin
    git rebase origin/main

Resuelve solamente conflictos en archivos propios. Si aparece un archivo del Integrante 1, detente y revisa la causa.

Crear docs/integracion/reporte-final.md con:

- Ramas.
- Orden de Pull Requests.
- Pruebas.
- Incidencias.
- Adaptadores.
- Enlace del repositorio.

## 17. Calidad

- ES Modules.
- HTML semántico.
- Foco visible.
- async/await.
- try/catch.
- Sin duplicados.
- Sin credenciales.
- Sin modificar archivos ajenos.
- Sin HTML inseguro con datos del usuario.

## 18. Commits sugeridos

    feat(ui): crear panel y navegacion responsiva
    feat(core): implementar api, feedback y errores
    feat(vacancies): completar CRUD de vacantes
    feat(companies): completar CRUD de empresas
    feat(applications): completar CRUD de postulaciones
    feat(integration): conectar autenticacion y seis modulos
    docs(i2): agregar README, video, bitacora e integracion

## 19. Respuesta final

Entrega:

- Archivos creados o modificados.
- Servicios y métodos implementados.
- Módulos integrados.
- Pruebas realizadas.
- Pendientes.
- Confirmación de que no modificaste archivos del Integrante 1.

No fusiones directamente a main. Deja la rama lista para Pull Request.

