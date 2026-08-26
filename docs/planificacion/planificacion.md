# Planificación JobConnect
## Objetivo
Construir una interfaz web de gestión de empleabilidad con Inicio corporativo, autenticación y seis módulos CRUD.

## Dominio
Candidatos, entrevistas/notas, tareas, vacantes, empresas clientes y postulaciones.

## Seis módulos
Candidatos `/users`; Entrevistas `/comments`; Tareas `/todos`; Vacantes `/products`; Empresas `/carts`; Postulaciones `/posts`.

## Requisitos
Funcionales: login, navegación desplegable, perfil por tipo de cuenta, CRUD, confirmación de borrado, feedback y estado local.
No funcionales: accesibilidad básica, responsive, ES Modules, separación por responsabilidades, manejo de errores.

## Flujo
Login → token `jobconnect.token` → `index.html` → `requireAuth` → shell → menú o perfil → módulo seleccionado → API/estado local → feedback.

## Arquitectura
HTML/CSS → app/shell → módulos → servicios comunes → DummyJSON.

## División
Integrante 1: auth, candidates, interviews, tasks y documentación académica.
Integrante 2: UI, perfil, servicios, vacancies, companies, applications e integración.

## Plan
Día 1 base y contrato. Días 2–3 módulos. Día 4 UI/servicios. Día 5 integración. Día 6 pruebas y documentación.

## Riesgos
CORS, red caída, cambios simulados no persistentes, conflictos Git y errores de integración. Validar cada operación, estado local y responsive.
