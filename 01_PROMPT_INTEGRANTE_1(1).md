# Prompt del Integrante 1 — Equipo de dos

## Autenticación, candidatos, entrevistas, tareas, planificación, infografía y reflexión

Usar después de que el Prompt 0 esté fusionado con main.

---

## Prompt para el agente de código

Actúa como desarrollador frontend de JobConnect. Implementa de principio a fin:

- El sistema de autenticación.
- Candidatos.
- Entrevistas y notas.
- Tareas del reclutador.
- Planificación.
- Contenido de la infografía.
- Reflexión final de NotebookLM.

Trabaja únicamente en:

    feature/i1-auth-candidatos-entrevistas-tareas

Antes de modificar:

1. Lee docs/arquitectura/propiedad-archivos.md.
2. Lee src/js/contracts/services.contract.js.
3. Revisa el repositorio.
4. Confirma que tu rama parte del main actualizado.

## Archivos autorizados

Solo puedes crear o modificar:

- login.html
- src/js/auth/**
- src/js/modules/candidates/**
- src/js/modules/interviews/**
- src/js/modules/tasks/**
- src/css/auth.css
- src/css/modules/candidates.css
- src/css/modules/interviews.css
- src/css/modules/tasks.css
- docs/planificacion/**
- docs/infografia/**
- docs/reflexion/**
- docs/notebooklm/integrante-1/**
- docs/pruebas/integrante-1.md

No puedes modificar:

- index.html
- README.md
- src/js/app.js
- src/js/contracts/**
- src/js/config/**
- src/js/core/**
- src/js/ui/**
- Los módulos vacancies, companies o applications.
- CSS global, feedback o estilos del Integrante 2.
- Video, bitácora o documentos de integración.

Si necesitas un cambio externo, anótalo en docs/pruebas/integrante-1.md bajo “Solicitud de integración”. No edites el archivo ajeno.

## 1. Autenticación completa

Endpoint:

    POST https://dummyjson.com/auth/login

Completa login.html con:

- Formulario accesible.
- Campos username y password.
- Labels asociados.
- Validación de campos vacíos.
- Botón de envío.
- Estado de carga.
- Mensaje entendible para credenciales incorrectas o fallo de red.
- Enlace a src/css/base.css sin modificarlo.
- Enlace a src/css/auth.css.
- Carga de src/js/auth/login-page.js como script type=module.

Implementa src/js/auth/auth-service.js y exporta exactamente:

    login(username, password)
    getToken()
    getCurrentUser()
    isAuthenticated()
    requireAuth()
    logout()

Reglas:

- Aceptar accessToken o token en la respuesta.
- Guardar el token como jobconnect.token.
- Guardar solo los datos necesarios del usuario como jobconnect.user.
- Redirigir a index.html después del login.
- requireAuth devuelve true cuando hay sesión.
- Sin sesión, requireAuth redirige a login.html y devuelve false.
- logout elimina token y usuario.
- No incluir credenciales o tokens en el código.
- No crear un api-client alternativo.

Crear src/js/auth/login-page.js para controlar únicamente login.html.

## 2. Contrato común de los módulos

Cada módulo debe tener index.js y exportar:

    export const moduleMeta = {
      id: "id-oficial",
      label: "Nombre visible"
    };

    export async function mount(container, services) {}
    export function unmount() {}

Reglas para los tres módulos:

- Trabajar solo dentro del container.
- Consumir services.api y services.feedback.
- No importar app.js, shell.js, api-client.js o feedback-service.js.
- Validar formularios.
- Mostrar carga, error y estado vacío.
- Confirmar DELETE mediante services.feedback.confirmDelete.
- Actualizar el arreglo local después de POST, PUT, PATCH o DELETE.
- Limpiar listeners y referencias en unmount.
- No utilizar variables globales.
- No usar alert para mensajes normales.

## 3. Candidatos completo

Endpoint:

    /users

Identificador:

    candidates

Métodos:

- GET para listar.
- POST para crear.
- PUT para reemplazar completamente.
- PATCH para editar campos seleccionados.
- DELETE con confirmación.

Campos mínimos:

- firstName
- lastName
- email
- phone

Ubicación:

    src/js/modules/candidates/

Metadatos:

    id: "candidates"
    label: "Candidatos"

## 4. Entrevistas y notas completo

Endpoint:

    /comments

Identificador:

    interviews

Métodos:

- GET para listar.
- POST para crear.
- PATCH para editar parcialmente.
- DELETE con confirmación.

Campos mínimos:

- body
- postId
- userId

Ubicación:

    src/js/modules/interviews/

Metadatos:

    id: "interviews"
    label: "Entrevistas y notas"

## 5. Tareas del reclutador completo

Endpoint:

    /todos

Identificador:

    tasks

Métodos:

- GET para listar.
- POST para crear.
- PATCH para cambiar texto o estado completed.
- DELETE con confirmación.

Campos mínimos:

- todo
- completed
- userId

Ubicación:

    src/js/modules/tasks/

Metadatos:

    id: "tasks"
    label: "Tareas"

## 6. Estilos

- auth.css debe quedar bajo .auth-page.
- candidates.css bajo .module--candidates.
- interviews.css bajo .module--interviews.
- tasks.css bajo .module--tasks.
- Utiliza variables de base.css cuando estén disponibles.
- No modifiques base.css, layout.css ni responsive.css.
- No uses selectores globales en los CSS de módulos.

## 7. Planificación exclusiva

Crear docs/planificacion/planificacion.md con:

- Descripción y objetivo.
- Dominio de empleabilidad.
- Seis módulos.
- Endpoints y métodos.
- Requerimientos funcionales y no funcionales.
- Flujo de autenticación.
- Arquitectura.
- División entre dos integrantes.
- Plan por días.
- Riesgos y validaciones.

## 8. Infografía exclusiva

Crear docs/infografia/contenido-infografia.md con contenido listo para diseñar:

- Arquitectura del sistema.
- Login y token.
- Seis módulos.
- Métodos HTTP.
- Flujo de navegación.
- Feedback.
- Estado local de DummyJSON.
- Responsabilidades de ambos integrantes.

Dejar un espacio para registrar la ruta o enlace del archivo gráfico final.

## 9. Reflexión exclusiva

Crear docs/reflexion/reflexion-final.md sobre:

- Apoyo de NotebookLM en planificación.
- Apoyo durante desarrollo.
- Consultas que cambiaron decisiones.
- Validación humana de respuestas.
- Limitaciones.
- Aprendizajes.
- Resultado final.

## 10. NotebookLM

Crear docs/notebooklm/integrante-1/consultas.md y registrar:

- Fecha.
- Pregunta.
- Resumen de respuesta.
- Aplicación al proyecto.
- Resultado.

Temas mínimos:

- Fetch API.
- DummyJSON.
- Tokens.
- PUT frente a PATCH.
- Headers.
- async/await.
- Procesos de empleabilidad.

## 11. Pruebas

Crear docs/pruebas/integrante-1.md con:

- Login correcto e incorrecto.
- Persistencia del token.
- Protección sin token.
- Logout.
- Cinco operaciones de candidatos.
- Cuatro operaciones de entrevistas.
- Cuatro operaciones de tareas.
- Formularios y validaciones.
- Errores de red.
- Estado local.
- Vista en teléfono y computadora.
- Solicitudes de integración.

Si los servicios del Integrante 2 todavía no existen, prueba los módulos con mocks que respeten services. Los mocks solo pueden quedar en documentación o archivos de prueba propios; no dentro de src/js/core/.

## 12. Calidad

- ES Modules.
- async/await.
- try/catch.
- Nombres descriptivos.
- Funciones pequeñas.
- Sin duplicar servicios.
- Sin modificar archivos ajenos.
- Sin insertar datos del usuario mediante HTML inseguro.

## 13. Commits sugeridos

    feat(auth): implementar login, sesion y logout
    feat(candidates): completar CRUD de candidatos
    feat(interviews): completar CRUD de entrevistas
    feat(tasks): completar CRUD de tareas
    docs(i1): agregar planificacion, infografia y reflexion

## 14. Respuesta final

Entrega:

- Archivos creados o modificados.
- Métodos HTTP implementados.
- Pruebas realizadas.
- Pendientes de integración.
- Confirmación de que no modificaste archivos del Integrante 2.

No hagas merge a main. Deja la rama lista para Pull Request.

