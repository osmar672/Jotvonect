# Pruebas del Integrante 2

Estados utilizados:

- **Aprobada:** validación ejecutada con resultado correcto.
- **Implementada:** funcionalidad terminada; requiere ejecución manual en navegador con la integración completa.
- **Pendiente I1:** depende de archivos del Integrante 1.
- **Pendiente remoto:** depende del repositorio remoto o de infraestructura externa.

## Matriz funcional

| ID | Área | Prueba | Resultado esperado | Estado |
| --- | --- | --- | --- | --- |
| I2-01 | Navegación | Recorrer módulos con Tab, flechas, Home y End | El foco permanece visible y llega a cada opción disponible | Implementada |
| I2-02 | Navegación | Cambiar de módulo | Se ejecuta `unmount`, se limpia el contenedor y se ejecuta `mount` | Aprobada por inspección y validación estática |
| I2-03 | Feedback | Mostrar loading, success, error y clear | Se reemplaza el mensaje anterior en `#feedback-root` | Implementada |
| I2-04 | Feedback | Confirmar eliminación | Devuelve `Promise<boolean>` sin usar `alert` | Aprobada por inspección y validación estática |
| I2-05 | Red | Simular respuesta HTTP 422 | Se lanza `AppError` con código `HTTP_422` | Aprobada con Fetch simulado |
| I2-06 | Red | Simular fallo de Fetch | Se lanza `AppError` con código `NETWORK_ERROR` | Aprobada con Fetch simulado |
| I2-07 | Vacantes | GET `/products` | Se muestra lista o estado vacío | Implementada |
| I2-08 | Vacantes | POST `/products/add` | Se agrega la nueva vacante al inicio del estado local | Implementada |
| I2-09 | Vacantes | PUT `/products/:id` | Se reemplaza el registro editado en estado local | Implementada |
| I2-10 | Vacantes | PATCH `/products/:id` | Se alterna el estado destacado | Implementada |
| I2-11 | Vacantes | DELETE `/products/:id` | Tras confirmar, se elimina del estado local | Implementada |
| I2-12 | Empresas | GET `/carts` | Los carts se presentan como empresas clientes | Implementada |
| I2-13 | Empresas | POST `/carts/add` | Se agrega una empresa al estado local | Implementada |
| I2-14 | Empresas | PUT `/carts/:id` | Se actualiza la empresa seleccionada | Implementada |
| I2-15 | Empresas | DELETE `/carts/:id` | Tras confirmar, se elimina del estado local | Implementada |
| I2-16 | Postulaciones | GET `/posts` | Se muestran postulaciones o estado vacío | Implementada |
| I2-17 | Postulaciones | POST `/posts/add` | Se agrega una postulación al estado local | Implementada |
| I2-18 | Postulaciones | PATCH `/posts/:id` | Se actualiza la postulación seleccionada | Implementada |
| I2-19 | Postulaciones | DELETE `/posts/:id` | Tras confirmar, se elimina del estado local | Implementada |
| I2-20 | Autenticación | Login y `requireAuth()` | La sesión permite entrar al panel | Pendiente I1 |
| I2-21 | Autenticación | Logout | Se limpia la sesión y se regresa a `login.html` | Pendiente I1 |
| I2-22 | Integración | Ordenar los seis módulos | candidates, vacancies, companies, applications, interviews, tasks | Pendiente I1 para 3 módulos; orden aprobado estáticamente |
| I2-23 | Estado local | Mutar un registro y cambiar de módulo | El cambio se conserva mientras el módulo siga montado según su ciclo de vida | Implementada; validar manualmente |
| I2-24 | Computadora | Probar ancho mayor a 1024 px | Menú lateral y tarjetas en columnas | Implementada; validar visualmente |
| I2-25 | Tablet | Probar entre 768 px y 1024 px | Formularios en una columna y contenido legible | Implementada; validar visualmente |
| I2-26 | Teléfono | Probar ancho menor a 512 px | Menú horizontal y acciones visibles a ancho completo | Implementada; validar visualmente |
| I2-27 | Consola | Recorrer el flujo completo | No hay errores ni recursos faltantes | Pendiente I1 por CSS y módulos todavía ausentes |
| I2-28 | Git | Verificar rama y ancestro main | La rama feature desciende de main | Aprobada localmente |
| I2-29 | Git | Ejecutar `fetch` y `rebase origin/main` | La rama queda actualizada sin tocar archivos ajenos | Pendiente remoto: no existe `origin` |

## Validaciones automatizadas ejecutadas

- `node --check` sobre los archivos JavaScript creados.
- Importación de cada módulo para comprobar `moduleMeta`, `mount` y `unmount`.
- Cliente API con Fetch simulado para GET, POST, PUT, PATCH y DELETE.
- Verificación del encabezado Bearer.
- Verificación de errores HTTP y de red normalizados.
- Comprobación estática del orden oficial de módulos.
- `git diff --check` para espacios y conflictos de parche.
- Verificación de que los CSS propios están encapsulados bajo su clase raíz.
- Prueba de servidor HTTP local con respuesta correcta para `index.html`, JavaScript, CSS y los tres módulos propios.

## Pruebas manuales posteriores al merge

1. Ejecutar el servidor local.
2. Iniciar sesión con el usuario público de DummyJSON.
3. Recorrer los seis módulos con mouse y teclado.
4. Ejecutar todas las mutaciones de la matriz.
5. Simular desconexión y validar feedback.
6. Probar 1440 px, 900 px y 390 px.
7. Revisar consola y pestaña Network.
8. Registrar capturas y resultado final en esta misma matriz.
