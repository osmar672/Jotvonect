# Propiedad de archivos para dos integrantes

| Responsable | Archivos o áreas completas |
|---|---|
| Integrante 1 | `src/js/auth/**`, Candidatos, Entrevistas, Tareas, planificación, bitácora y reflexión |
| Integrante 2 | `server.js`, `app.js`, `ui/**`, `profile/**`, `animations/**`, Inicio, `config/**`, `api-client.js`, Vacantes, Empresas, Postulaciones, CSS, README, video e integración |
| Compartidos después de revisión | `src/js/core/crud-module.js`, `src/js/contracts/**`, `package.json`, `package-lock.json`, `tests/**` |

Los archivos compartidos se consideran congelados mientras cada integrante desarrolla sus módulos. Cualquier cambio posterior debe realizarse en una rama de integración y revisarse mediante Pull Request.

Cada módulo conserva una responsabilidad completa y se conecta mediante `moduleMeta`, `moduleConfig`, `mount`, `unmount` y los servicios comunes.
