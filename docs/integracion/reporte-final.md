# Reporte final de integración

## Ramas

| Propósito | Rama | Estado |
| --- | --- | --- |
| Base | `main` local | Creada a partir de la arquitectura congelada |
| Integrante 1 | Pendiente de confirmar | No disponible en este repositorio local |
| Integrante 2 | `feature/i2-ui-core-vacantes-empresas-postulaciones` | Implementación completa de archivos propios |

No existe un remoto `origin` en el entorno actual. Por ese motivo no fue posible ejecutar `git fetch origin` ni comprobar `origin/main`.

## Orden de Pull Requests

1. Abrir y revisar el Pull Request del Integrante 1.
2. Fusionarlo mediante el proceso definido por el equipo.
3. Desde la rama del Integrante 2 ejecutar:

   ```bash
   git fetch origin
   git rebase origin/main
   ```

4. Si aparece un conflicto en un archivo del Integrante 1, detener la resolución y revisar la causa.
5. Activar `integrantOneReady` en `src/js/config/integration-config.js`.
6. Ejecutar todas las pruebas manuales y actualizar `docs/pruebas/integrante-2.md`.
7. Abrir el Pull Request del Integrante 2.
8. No fusionar esta rama directamente a `main`.

## Pruebas

Se ejecutaron validaciones de sintaxis, contratos, métodos HTTP, token Bearer, errores normalizados, orden de módulos, encapsulamiento CSS, entrega mediante servidor HTTP local y estado de Git. La matriz detallada está en `docs/pruebas/integrante-2.md`.

Las pruebas de login, logout, seis módulos, consola sin recursos faltantes y flujo visual completo quedan pendientes hasta recibir el Pull Request del Integrante 1.

## Incidencias y pendientes

1. El repositorio recibido no contenía metadatos Git; se creó `main` local y desde ahí la rama feature solicitada.
2. No existe remoto `origin`; el fetch, rebase y Pull Request reales quedan pendientes.
3. No existen todavía `auth-service.js`, Candidatos, Entrevistas ni Tareas.
4. Los CSS del Integrante 1 están enlazados en el orden solicitado, pero los archivos se incorporan con su Pull Request.
5. Las evidencias de NotebookLM del Integrante 1 aún no fueron entregadas y no se inventaron.
6. El enlace del repositorio y del video están pendientes.

## Adaptadores

- `integration-config.js` registra las rutas esperadas del Integrante 1 y evita cargar archivos inexistentes antes del merge.
- `app.js` valida el contrato de autenticación y de cada módulo antes de registrarlo.
- La fachada `authFacade` expone únicamente `getToken`, `isAuthenticated` y `logout` a los módulos.
- Cuando la autenticación todavía no existe, la fachada no almacena credenciales ni simula una sesión; la interfaz muestra el pendiente.
- El arreglo único de `app.js` preserva el orden `candidates`, `vacancies`, `companies`, `applications`, `interviews`, `tasks` y filtra únicamente los archivos aún ausentes.

No se modificó la implementación interna de ningún archivo del Integrante 1.

## Enlaces

- Repositorio: pendiente.
- Pull Request del Integrante 1: pendiente.
- Pull Request del Integrante 2: pendiente.
- Video: pendiente en `docs/video/enlace-video.md`.
