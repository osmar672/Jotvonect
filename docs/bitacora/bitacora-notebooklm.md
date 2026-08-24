# Bitácora de NotebookLM

Esta bitácora distingue entre consultas documentadas por el Integrante 2 y evidencias todavía pendientes de recibir del Integrante 1. No se atribuyen respuestas a NotebookLM sin contar con su evidencia correspondiente.

## Entrada 1

- Fecha: 2026-08-24.
- Integrante: Integrante 2.
- Pregunta: ¿Cómo desacoplar seis módulos desarrollados por dos personas sin que importen servicios internos entre sí?
- Respuesta resumida: Definir un contrato común `mount`/`unmount`, inyectar un único objeto `services` y reservar `app.js` como punto de composición.
- Aplicación: Se implementó un registro único y el shell solo recibe metadatos y callbacks.
- Resultado: Los módulos propios no importan autenticación, shell, feedback ni cliente API.

## Entrada 2

- Fecha: 2026-08-24.
- Integrante: Integrante 2.
- Pregunta: ¿Cómo reflejar operaciones simuladas de DummyJSON si el servidor no persiste cambios?
- Respuesta resumida: Actualizar el arreglo local únicamente después de una respuesta exitosa y volver al estado remoto al recargar.
- Aplicación: Vacantes, Empresas y Postulaciones agregan, reemplazan o eliminan registros de su estado local.
- Resultado: La interfaz conserva coherencia durante la sesión.

## Entrada 3

- Fecha: 2026-08-24.
- Integrante: Integrante 2.
- Pregunta: ¿Cómo diseñar navegación accesible para escritorio y móvil?
- Respuesta resumida: Utilizar elementos `nav`, listas y botones nativos, mantener foco visible y añadir navegación con flechas, Home y End.
- Aplicación: `renderShell` implementa navegación semántica y foco administrado.
- Resultado: El menú es operable por teclado y cambia de lateral a horizontal en pantallas pequeñas.

## Entrada 4

- Fecha: 2026-08-24.
- Integrante: Integrante 2.
- Pregunta: ¿Cómo manejar errores HTTP y de red sin acoplar el cliente API a la interfaz?
- Respuesta resumida: Normalizar los errores en la capa central, lanzarlos y permitir que cada módulo decida qué mensaje enviar a feedback.
- Aplicación: `api-client.js` utiliza `error-normalizer.js` y no manipula el DOM.
- Resultado: Los errores tienen mensaje, código y estado consistentes.

## Entrada 5

- Fecha: 2026-08-24.
- Integrante: Integrante 2.
- Pregunta: ¿Cómo integrar archivos que todavía pertenecen a otro Pull Request?
- Respuesta resumida: No crear sustitutos; registrar rutas esperadas, mantener la integración deshabilitada y activarla después del merge.
- Aplicación: `integration-config.js` conserva `integrantOneReady: false` y `app.js` documenta el pendiente.
- Resultado: La rama funciona con sus tres módulos sin modificar archivos ajenos.

## Evidencias del Integrante 1 pendientes

Las consultas y capturas del Integrante 1 todavía no están disponibles en esta rama. Después de su Pull Request se debe añadir, sin reescribir sus archivos:

| Fecha | Pregunta | Respuesta resumida | Aplicación | Resultado | Evidencia |
| --- | --- | --- | --- | --- | --- |
| Pendiente | Autenticación | Pendiente | Pendiente | Pendiente | Enlace o captura pendiente |
| Pendiente | Candidatos | Pendiente | Pendiente | Pendiente | Enlace o captura pendiente |
| Pendiente | Entrevistas | Pendiente | Pendiente | Pendiente | Enlace o captura pendiente |
| Pendiente | Tareas | Pendiente | Pendiente | Pendiente | Enlace o captura pendiente |
