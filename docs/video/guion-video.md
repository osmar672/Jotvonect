# Guion del video de JobConnect

Duración objetivo: 7 a 9 minutos.

## 1. Presentación — 0:00 a 0:35

“Hola. En este video presentamos JobConnect, una aplicación web modular para administrar un proceso de reclutamiento. Fue desarrollada con HTML, CSS y JavaScript mediante ES Modules, sin frameworks ni dependencias externas. DummyJSON funciona como API de prueba.”

Mostrar brevemente la pantalla principal y mencionar a los dos integrantes.

## 2. Login — 0:35 a 1:10

Mostrar `login.html` y explicar:

- Validación de usuario y contraseña.
- Uso del endpoint de autenticación de DummyJSON.
- Almacenamiento y recuperación del token según la implementación del Integrante 1.
- Redirección a `index.html` cuando existe sesión.
- Protección mediante `requireAuth()`.

Realizar un inicio de sesión con las credenciales públicas de prueba.

## 3. Interfaz y navegación — 1:10 a 1:50

“La interfaz principal muestra el usuario actual, el botón para cerrar sesión y un menú con los seis módulos. La navegación funciona con clic, Tab y las flechas del teclado. Cada selección desmonta el módulo anterior antes de montar el siguiente.”

Recorrer el menú en este orden:

1. Candidatos.
2. Vacantes.
3. Empresas clientes.
4. Postulaciones.
5. Entrevistas y notas.
6. Tareas.

## 4. Candidatos — 1:50 a 2:25

Mostrar la carga de candidatos, crear uno, editarlo y eliminarlo. Explicar que el módulo pertenece al Integrante 1 y utiliza `/users`.

## 5. Vacantes — 2:25 a 3:20

Mostrar:

- Carga GET desde `/products`.
- Creación POST con título, descripción, categoría y referencia salarial.
- Edición completa con PUT.
- Acción “Destacar” mediante PATCH.
- Confirmación y eliminación mediante DELETE.
- Actualización inmediata del estado local.

## 6. Empresas clientes — 3:20 a 4:05

Explicar que `/carts` se presenta como un directorio de empresas sin modificar el endpoint. Demostrar:

- GET del directorio.
- POST de una empresa.
- PUT para editar la cuenta.
- DELETE con confirmación.

## 7. Postulaciones — 4:05 a 4:50

Mostrar los campos `title`, `body` y `userId`. Ejecutar:

- GET de postulaciones.
- POST de un registro.
- PATCH de una postulación.
- DELETE confirmado.

## 8. Entrevistas y tareas — 4:50 a 5:35

Recorrer ambos módulos del Integrante 1. Mostrar una operación representativa en `/comments` y otra en `/todos`. Explicar que todos reciben el mismo objeto `services` y respetan `mount`/`unmount`.

## 9. Feedback y errores — 5:35 a 6:15

Mostrar los mensajes de carga, éxito y error. Forzar un error de red de manera controlada y explicar que:

- El cliente API normaliza el error.
- El módulo no manipula directamente `#feedback-root`.
- La aplicación permanece utilizable.
- La confirmación de borrado es accesible y devuelve `Promise<boolean>`.

## 10. Responsividad — 6:15 a 6:55

Mostrar la aplicación en:

- Computadora: menú lateral y tarjetas en varias columnas.
- Tablet: contenido reducido y formularios en una columna.
- Teléfono: navegación horizontal, botones a ancho completo y feedback inferior.

Confirmar que ninguna acción necesaria queda oculta.

## 11. Repositorio — 6:55 a 7:40

Mostrar:

- La rama de cada integrante.
- Los Pull Requests.
- La propiedad exclusiva de archivos.
- El contrato congelado.
- Los commits por funcionalidad.
- Las pruebas y el reporte de integración.

Explicar que primero se integra el Pull Request del Integrante 1 y después el del Integrante 2.

## 12. Conclusión — 7:40 a 8:10

“JobConnect demuestra una arquitectura modular, accesible y responsiva. La separación por archivos permitió trabajar en paralelo, mientras que los contratos compartidos evitaron acoplamiento entre los módulos. Las mutaciones de DummyJSON se reflejan mediante estado local para conservar una experiencia coherente durante la sesión.”
