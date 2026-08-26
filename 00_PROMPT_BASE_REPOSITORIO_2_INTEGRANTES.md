# Prompt 0 — Base común de JobConnect para dos integrantes

## Cuándo utilizarlo

El Integrante 2 debe ejecutar este prompt una sola vez antes de iniciar el desarrollo. Después debe fusionar la rama base con main. Ambos integrantes crearán sus ramas desde ese mismo main actualizado.

---

## Prompt para el agente de código

Actúa como responsable de arquitectura e integración de JobConnect. Prepara únicamente la base del repositorio para que dos desarrolladores puedan trabajar sin modificar los mismos archivos.

No implementes todavía autenticación ni módulos CRUD.

## Tecnología

- HTML5.
- CSS3.
- JavaScript mediante ES Modules.
- Fetch API.
- async/await y try/catch.
- Sin frameworks.
- Sin dependencias externas.
- Sin package.json ni package-lock.json.
- API base: https://dummyjson.com

## Estructura inicial

    /
    ├── .gitignore
    ├── index.html
    ├── login.html
    ├── src/
    │   ├── css/
    │   │   └── base.css
    │   └── js/
    │       ├── app.js
    │       └── contracts/
    │           └── services.contract.js
    └── docs/
        ├── arquitectura/
        │   └── propiedad-archivos.md
        └── integracion/
            └── reglas-integracion.md

## Archivos base

### index.html

Crear HTML válido con:

- Un elemento con id app.
- Un elemento con id feedback-root.
- src/js/app.js cargado como script type=module.
- Sin interfaz final ni imports de módulos.

Después de fusionar la base, index.html pertenece exclusivamente al Integrante 2.

### login.html

Crear una página válida con un elemento id login-root. No implementar todavía el formulario.

Después de fusionar la base, login.html pertenece exclusivamente al Integrante 1.

### src/css/base.css

Dejar únicamente un comentario de propiedad. Después de la base será responsabilidad del Integrante 2.

### src/js/app.js

Crear un punto de entrada mínimo que no importe archivos inexistentes. Después de la base será responsabilidad exclusiva del Integrante 2.

### src/js/contracts/services.contract.js

Crear un contrato JSDoc congelado, sin lógica funcional.

Todos los módulos deben exportar:

    export const moduleMeta = {
      id: "identificador-unico",
      label: "Nombre visible"
    };

    export async function mount(container, services) {}
    export function unmount() {}

Cada módulo debe renderizar únicamente dentro del container recibido.

El objeto services tendrá:

    services.api.get(path)
    services.api.post(path, data)
    services.api.put(path, data)
    services.api.patch(path, data)
    services.api.remove(path)

    services.feedback.loading(message)
    services.feedback.success(message)
    services.feedback.error(message)
    services.feedback.clear()
    services.feedback.confirmDelete(message)

    services.auth.getToken()
    services.auth.isAuthenticated()
    services.auth.logout()

    services.profile.get()
    services.profile.save(profile)
    services.profile.reset()

confirmDelete debe devolver Promise<boolean>.

El servicio de autenticación exportará:

    login(username, password)
    getToken()
    getCurrentUser()
    isAuthenticated()
    requireAuth()
    logout()

requireAuth devuelve true cuando hay sesión. Si no existe sesión, redirige a login.html y devuelve false.

La interfaz principal exportará:

    renderShell({
      root,
      modules,
      onSelect,
      onLogout,
      profileService,
      onProfileSaved
    })

renderShell debe devolver:

    {
      contentContainer,
      setActive,
      setUser,
      closeMenu,
      destroy
    }

Ninguno de los dos integrantes puede modificar services.contract.js después de fusionar la base.

## Identificadores oficiales

| Módulo | id | Endpoint |
|---|---|---|
| Candidatos | candidates | /users |
| Entrevistas y notas | interviews | /comments |
| Tareas | tasks | /todos |
| Vacantes | vacancies | /products |
| Empresas clientes | companies | /carts |
| Postulaciones | applications | /posts |

## Propiedad exclusiva de archivos

Documenta lo siguiente en docs/arquitectura/propiedad-archivos.md:

| Responsable | Puede modificar exclusivamente |
|---|---|
| Integrante 1 | login.html, src/js/auth/**, src/js/modules/candidates/**, src/js/modules/interviews/**, src/js/modules/tasks/**, src/css/auth.css, src/css/modules/candidates.css, src/css/modules/interviews.css, src/css/modules/tasks.css, docs/planificacion/**, docs/infografia/**, docs/reflexion/**, docs/notebooklm/integrante-1/** y docs/pruebas/integrante-1.md |
| Integrante 2 | index.html, README.md, src/js/app.js, src/js/config/**, src/js/core/**, src/js/ui/**, src/js/profile/**, src/js/animations/**, src/js/modules/home/**, src/js/modules/vacancies/**, src/js/modules/companies/**, src/js/modules/applications/**, src/css/base.css, src/css/layout.css, src/css/responsive.css, src/css/components/feedback.css, src/css/components/profile-panel.css, src/css/modules/home.css, src/css/modules/vacancies.css, src/css/modules/companies.css, src/css/modules/applications.css, docs/video/**, docs/bitacora/**, docs/integracion/**, docs/notebooklm/integrante-2/** y docs/pruebas/integrante-2.md |
| Congelados | src/js/contracts/** y docs/arquitectura/propiedad-archivos.md |

## Reglas de integración

Documentar en docs/integracion/reglas-integracion.md:

- Cada archivo tiene un único responsable.
- Ningún integrante edita archivos ajenos.
- Los módulos se comunican únicamente mediante el contrato mount/unmount y services.
- app.js es el único archivo que registra los seis módulos.
- El Integrante 1 no debe importar app.js, shell, api-client ni feedback.
- El Integrante 2 no debe modificar internamente auth ni los tres módulos del Integrante 1.
- No crear duplicados como auth2.js, api-final.js o app-copia.js.
- No renombrar ni mover carpetas ajenas.
- No aplicar formateo global al repositorio.
- Cada CSS de módulo utiliza una clase raíz propia.
- Los cambios simulados por DummyJSON se reflejan mediante estado local.
- Las solicitudes de cambios externos se anotan en el documento de pruebas del responsable.

## Validaciones

- index.html y login.html son válidos.
- app.js no importa archivos inexistentes.
- No existe lógica CRUD.
- El contrato y la propiedad de archivos están completos.
- Se muestra la lista exacta de archivos creados.

## Git

Trabaja en:

    chore/base-jobconnect-dos-integrantes

Commit:

    chore: crear base de JobConnect para dos integrantes

Detente después de preparar la base. No desarrolles funciones asignadas a los integrantes.
