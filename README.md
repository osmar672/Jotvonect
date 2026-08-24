# JobConnect

JobConnect es una aplicación web académica para centralizar la gestión de un proceso de reclutamiento. La interfaz permite navegar entre candidatos, vacantes, empresas clientes, postulaciones, entrevistas y tareas, utilizando DummyJSON como API REST simulada.

## Objetivo

Construir una solución modular en la que dos integrantes puedan desarrollar funcionalidades completas sin modificar los mismos archivos. Cada módulo se conecta con la aplicación mediante el contrato congelado `mount(container, services)` y `unmount()`.

## Tecnologías

- HTML5 semántico.
- CSS3 responsivo.
- JavaScript con ES Modules.
- Fetch API.
- `async`/`await` y `try`/`catch`.
- DummyJSON como API de pruebas.
- Git y Pull Requests para integración.

No se utilizan frameworks, dependencias externas, `package.json` ni `package-lock.json`.

## Estructura principal

```text
JobConnect/
├── index.html
├── login.html
├── README.md
├── src/
│   ├── css/
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── responsive.css
│   │   ├── components/
│   │   └── modules/
│   └── js/
│       ├── app.js
│       ├── auth/
│       ├── config/
│       ├── contracts/
│       ├── core/
│       ├── modules/
│       └── ui/
└── docs/
    ├── arquitectura/
    ├── bitacora/
    ├── integracion/
    ├── notebooklm/
    ├── pruebas/
    └── video/
```

Las carpetas del Integrante 1 aparecen después de fusionar su Pull Request. Esta rama no crea sustitutos para esos archivos.

## Ejecución local

Los ES Modules requieren servir el proyecto mediante HTTP. No se debe abrir `index.html` directamente con el protocolo `file://`.

Con Python:

```bash
python -m http.server 8000
```

Luego abre:

```text
http://localhost:8000/
```

También se puede utilizar una extensión de servidor local del editor, siempre que la raíz publicada sea la carpeta del repositorio.

## API

La URL base se define una sola vez en `src/js/config/api-config.js`:

```text
https://dummyjson.com
```

El cliente compartido agrega `Content-Type: application/json`, envía `Authorization: Bearer` cuando existe token y normaliza respuestas HTTP y errores de red.

## Credenciales públicas de prueba

DummyJSON documenta este usuario de demostración:

```text
Usuario: emilys
Contraseña: emilyspass
```

Son credenciales públicas para la API simulada; no deben reemplazarse por credenciales personales.

## Autenticación

La autenticación pertenece al Integrante 1 y debe exportar:

```text
login(username, password)
getToken()
getCurrentUser()
isAuthenticated()
requireAuth()
logout()
```

`app.js` contiene únicamente la composición. Mientras el servicio del Integrante 1 no exista, la aplicación funciona en modo de integración con los tres módulos disponibles y muestra el pendiente. Después del merge se valida el contrato, se ejecuta `requireAuth()` y el token se entrega al cliente API mediante `getToken`.

## Módulos y operaciones

| Orden | Módulo | ID | Recurso | Métodos |
| --- | --- | --- | --- | --- |
| 1 | Candidatos | `candidates` | `/users` | GET, POST, PUT, DELETE |
| 2 | Vacantes | `vacancies` | `/products` | GET, POST, PUT, PATCH, DELETE |
| 3 | Empresas clientes | `companies` | `/carts` | GET, POST, PUT, DELETE |
| 4 | Postulaciones | `applications` | `/posts` | GET, POST, PATCH, DELETE |
| 5 | Entrevistas y notas | `interviews` | `/comments` | GET, POST, PATCH, DELETE |
| 6 | Tareas | `tasks` | `/todos` | GET, POST, PATCH, DELETE |

Los métodos de los módulos del Integrante 1 deben confirmarse contra su implementación antes del reporte final conjunto.

## Estado local

DummyJSON simula las operaciones de creación, actualización y eliminación, pero no persiste esos cambios en el servidor. Por esa razón cada módulo actualiza su arreglo local después de una mutación exitosa. Al recargar la página se vuelve a obtener el conjunto original de la API.

## Uso

1. Inicia el servidor local.
2. Accede a `login.html` cuando la autenticación esté fusionada.
3. Inicia sesión con las credenciales públicas de prueba.
4. Usa el menú lateral o superior según el tamaño de pantalla.
5. Completa los formularios para crear registros.
6. Utiliza las acciones de cada tarjeta para editar, actualizar parcialmente o eliminar.
7. Confirma una eliminación desde el panel accesible de feedback.

## División de trabajo

### Integrante 1

- Login y autenticación.
- Candidatos.
- Entrevistas y notas.
- Tareas.
- Sus estilos, pruebas y documentación asignada.

### Integrante 2

- Panel principal, navegación y responsividad.
- Cliente API, errores y feedback.
- Vacantes.
- Empresas clientes.
- Postulaciones.
- Integración, README, video y documentación técnica.

La propiedad exacta se encuentra en `docs/arquitectura/propiedad-archivos.md`.

## Ramas y Pull Requests

- Base local: `main`.
- Integrante 2: `feature/i2-ui-core-vacantes-empresas-postulaciones`.
- Rama del Integrante 1: pendiente de confirmar en el repositorio remoto.

Orden recomendado:

1. Revisar y fusionar el Pull Request del Integrante 1.
2. Actualizar esta rama con `git fetch origin` y `git rebase origin/main`.
3. Resolver únicamente conflictos en archivos del Integrante 2.
4. Habilitar la integración en `src/js/config/integration-config.js`.
5. Ejecutar la matriz completa de pruebas.
6. Abrir el Pull Request del Integrante 2.

Esta rama no debe fusionarse directamente a `main`.

## Entregables

- Código fuente modular.
- Interfaz adaptable a computadora, tablet y teléfono.
- Cliente API y feedback accesible.
- Seis módulos después de la integración de ambos Pull Requests.
- Pruebas documentadas por integrante.
- Material y enlace del video.
- Consultas y bitácora de NotebookLM.
- Reporte final de integración.

## Enlaces finales

- Repositorio: pendiente de URL remota.
- Pull Request del Integrante 1: pendiente.
- Pull Request del Integrante 2: pendiente.
- Video: consultar `docs/video/enlace-video.md`.
- API: <https://dummyjson.com>
