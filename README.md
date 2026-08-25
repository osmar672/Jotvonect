# JobConnect

JobConnect es una empresa digital y una aplicación web para administrar procesos de empleabilidad. Su experiencia de Inicio presenta la propuesta de valor de la organización y conecta seis módulos de gestión con la API pública de DummyJSON mediante `fetch` y autenticación con token. La navegación se abre bajo demanda desde el encabezado y cada usuario dispone de un perfil configurable según sea persona candidata, reclutador o empresa.

## Requisitos

- Node.js 18 o superior.
- npm, incluido con Node.js.
- Conexión a Internet para comunicarse con `https://dummyjson.com`.
- Un navegador moderno con soporte para módulos de JavaScript.

Las versiones exactas de las dependencias quedan registradas en `package-lock.json` para que todos los integrantes trabajen con el mismo entorno.

## Ejecución

1. Abre una terminal dentro de la carpeta del proyecto.
2. Instala las bibliotecas declaradas:

   ```bash
   npm install
   ```

3. Inicia el servidor:

   ```bash
   npm start
   ```

4. Abre `http://127.0.0.1:3000`.
5. Inicia sesión con la cuenta pública de prueba:

   - Usuario: `emilys`
   - Contraseña: `emilyspass`

Para usar otro puerto:

```bash
JOBCONNECT_PORT=8080 npm start
```

En PowerShell:

```powershell
$env:JOBCONNECT_PORT=8080
npm start
```

## Pruebas y validación

Ejecuta toda la batería automática con:

```bash
npm test
```

Las pruebas verifican:

- Login, almacenamiento del token y cierre de sesión.
- Protección del panel cuando no existe una sesión.
- Header `Authorization: Bearer` en el cliente HTTP.
- Métodos GET, POST, PUT, PATCH y DELETE.
- Rutas `/add` requeridas por DummyJSON para crear registros.
- Navegación entre Inicio y los seis módulos de gestión.
- Apertura del panel de navegación y ausencia de la antigua barra lateral fija.
- Perfil por cuenta, campos laborales, tipos de usuario, movilidad y persistencia local.
- Contenido corporativo, narrativa de scroll y botones de acceso rápido de Inicio.
- Tema claro/oscuro persistente y transiciones entre módulos.
- Vistas de tarjetas/lista, ordenamiento, indicadores, skeletons y editor lateral de los CRUD.
- Formularios, botones de edición y eliminación, y estado local.
- Modal propio de confirmación, con cancelación por botón, fondo y tecla Escape.
- Servidor Node, ruta `/health` y publicación de archivos.
- Sintaxis de todos los archivos JavaScript y referencias HTML/CSS/JS.
- Disponibilidad local de GSAP, Lenis y Anime.js.

También se puede ejecutar solamente la validación estructural:

```bash
npm run validate
```

## Módulos y endpoints

| Módulo | Recurso | Métodos implementados |
|---|---|---|
| Candidatos | `/users` y `/users/add` | GET, POST, PUT, PATCH, DELETE |
| Vacantes | `/products` y `/products/add` | GET, POST, PUT, PATCH, DELETE |
| Empresas clientes | `/carts` y `/carts/add` | GET, POST, PUT, DELETE |
| Postulaciones | `/posts` y `/posts/add` | GET, POST, PATCH, DELETE |
| Entrevistas y notas | `/comments` y `/comments/add` | GET, POST, PATCH, DELETE |
| Tareas | `/todos` y `/todos/add` | GET, POST, PATCH, DELETE |

Los módulos de candidatos y vacantes muestran dos acciones distintas de edición: `Editar (PUT)` y `Editar (PATCH)`. De esta manera ambos métodos solicitados en el enunciado pueden demostrarse desde la interfaz.

### Experiencia de gestión

Los seis módulos comparten una experiencia consistente: indicadores con contadores animados, búsqueda, ordenamiento, cambio entre tarjetas y lista, estados de carga mediante skeletons y estados vacíos explicativos. Crear o editar abre un panel lateral accesible que conserva el contexto de la lista. Después de guardar o eliminar, la tarjeta correspondiente recibe una transición visual sin alterar la lógica HTTP ni el estado local.

## Inicio y experiencia visual

Inicio comunica que JobConnect es una empresa digital enfocada en conectar talento, organizaciones y equipos de reclutamiento. La experiencia continúa directamente hacia la narrativa del proceso de trabajo y los accesos principales del producto.

La dirección visual toma como referencia experiencias digitales contemporáneas como Lusion: alto contraste, tipografía de gran escala, bloques de color, figuras geométricas y una experiencia que responde al desplazamiento y al puntero. La implementación es original y utiliza tres bibliotecas con responsabilidades separadas:

- `GSAP` y `ScrollTrigger`: secuencias de entrada, profundidad, texto cinético, portal y transformaciones sincronizadas con el desplazamiento.
- `Anime.js`: movimiento continuo y orgánico de las figuras geométricas del encabezado.
- `Lenis`: desplazamiento fluido sincronizado con las animaciones de Inicio.

En equipos con mouse, el encabezado responde a la posición del puntero y los botones tienen atracción magnética. El explorador de estándares incorpora progreso, figuras distintas, entrada por palabras y desplazamiento asistido en móvil. La sección de trabajo funciona como una narrativa: al avanzar por Entender, Diseñar, Construir y Validar, el escenario fijo cambia contenido, color y progreso mediante ScrollTrigger. No se utiliza una franja de indicadores ni una cinta tipográfica.

Las animaciones específicas se cargan de manera diferida al abrir Inicio. El sistema global agrega transiciones entre módulos, aparición escalonada de paneles, microinteracciones, ondas de pulsación y contadores. Si JavaScript de animación falla, el contenido permanece visible; si el sistema solicita movimiento reducido, los efectos se desactivan.

## Navegación y perfil configurable

El panel ya no mantiene una barra lateral ocupando espacio de forma permanente. El botón **Menú** abre un panel con Inicio y los seis módulos, entrada escalonada y una vista previa que cambia de color y contenido al recorrer cada destino. Puede cerrarse desde su botón, el fondo o la tecla Escape, y conserva el foco dentro del panel mientras está abierto.

El botón con el nombre de Emily abre el perfil. Los datos comunes son nombre completo, correo, país y provincia o estado. Los campos adicionales cambian según el tipo de cuenta:

- **Busco trabajo:** empleo deseado, modalidad, diplomas y certificaciones, habilidades técnicas, habilidades blandas, distancia máxima y disponibilidad para trasladarse.
- **Soy reclutador/a:** organización, cargo, cobertura y áreas de reclutamiento.
- **Represento una empresa:** nombre, sector, descripción, tipos de vacantes y disponibilidad de trabajo remoto.

El perfil incluye avatar, porcentaje de información completada y una tarjeta profesional que se actualiza mientras se escribe. Los cambios de tipo de cuenta animan los campos correspondientes. Las preferencias se guardan en `localStorage` con una clave diferente para cada cuenta. **Cerrar sesión** se encuentra exclusivamente dentro de este panel y elimina el token y el usuario autenticado, sin borrar las preferencias laborales guardadas para un próximo ingreso.

El botón de tema del encabezado alterna modo claro y oscuro. La elección también se conserva en `localStorage` y todos los controles mantienen contraste y foco visible.

## Autenticación

El formulario envía las credenciales a `/auth/login`. Cuando la respuesta es correcta:

1. Se guarda `accessToken` en `localStorage` con la clave `jobconnect.token`.
2. Se guarda la información básica del usuario en `jobconnect.user`.
3. El panel comprueba la existencia del token antes de cargar los módulos.
4. El cliente API agrega `Authorization: Bearer <token>` a sus solicitudes.
5. El perfil se carga con la identidad de la sesión y conserva sus preferencias por cuenta.
6. Cerrar sesión, desde el botón de perfil, elimina token y usuario y regresa a `login.html`.

Las credenciales incluidas son cuentas públicas de demostración de DummyJSON, no secretos del proyecto.

## Estado local y DummyJSON

DummyJSON simula POST, PUT, PATCH y DELETE, pero no guarda los cambios permanentemente. JobConnect actualiza su arreglo local después de cada respuesta para que el usuario pueda ver inmediatamente la creación, edición o eliminación.

Los registros creados durante la sesión reciben una clave interna única. Si se editan o eliminan después, la operación se mantiene localmente para evitar errores causados por identificadores simulados que todavía no existen en el servidor de DummyJSON. Al recargar la página se recupera nuevamente la información original de la API.

## Estructura principal

```text
JobConnect/
├── index.html
├── login.html
├── server.js
├── package.json
├── package-lock.json
├── src/
│   ├── css/
│   └── js/
│       ├── app.js
│       ├── animations/
│       ├── auth/
│       ├── config/
│       ├── contracts/
│       ├── core/
│       ├── modules/
│       ├── profile/
│       └── ui/
├── tests/
├── scripts/
└── docs/
```

### Flujo interno

1. `login-page.js` utiliza `auth-service.js` para iniciar la sesión.
2. `app.js` protege la página y registra Inicio junto con los seis módulos de gestión.
3. `shell.js` construye los botones del encabezado y los paneles de navegación y perfil.
4. `profile-service.js` normaliza y conserva las preferencias de cada cuenta.
5. `theme-controller.js` aplica el tema persistente y `interface-motion.js` coordina transiciones y microinteracciones.
6. Inicio carga sus animaciones desde `home-motion.js` solamente cuando se monta.
7. Cada módulo CRUD entrega su configuración a `crud-module.js`.
8. `crud-module.js` conecta formularios laterales, vistas, ordenamiento, búsqueda, estado local y mensajes.
9. `api-client.js` realiza las solicitudes a DummyJSON con timeout y manejo de errores.

## Manejo de errores y accesibilidad

- Todas las operaciones asíncronas muestran carga, éxito o error.
- Los fallos de red y HTTP se convierten en mensajes entendibles.
- Los botones delegados capturan también los errores de funciones asíncronas.
- DELETE solicita confirmación mediante un modal propio; no usa alertas nativas del navegador.
- El modal mantiene el foco dentro de sus acciones, prioriza «Cancelar» y se cierra con Escape o al pulsar el fondo.
- Los formularios usan etiquetas, validación nativa, tipos de entrada adecuados y estados ARIA.
- Los paneles de menú y perfil se abren desde botones, atrapan el foco y se cierran con su control, el fondo o Escape.
- La interfaz incluye estilos para teléfono, tableta y computadora, además de reducción de movimiento.
- Las animaciones funcionan como mejora progresiva y no bloquean la navegación ni el contenido.

## Servidor Node

`server.js` es un servidor estático de desarrollo. No agrega una base de datos ni reemplaza DummyJSON, por lo que la solución continúa siendo frontend. Publica los archivos del proyecto, incorpora encabezados básicos de seguridad y ofrece:

```text
GET /health
POST /api/assistant
```

### Asistente de IA con Gemini

El chat “Conecta” usa la API real de Gemini desde el servidor. Crea una clave en Google AI Studio y arranca la aplicación así:

```bash
GEMINI_API_KEY="tu_clave" npm start
```

Opcionalmente puedes cambiar el modelo (por defecto `gemini-2.5-flash`):

```bash
GEMINI_API_KEY="tu_clave" GEMINI_MODEL="gemini-2.5-flash" npm start
```

La clave se lee exclusivamente en `server.js`; nunca debe guardarse en Git ni enviarse al frontend.

Respuesta esperada:

```json
{"status":"ok","application":"JobConnect"}
```

## Flujo de Git recomendado

Antes de subir los cambios, cada integrante debe trabajar en su propia rama y evitar editar archivos asignados al otro integrante. Para integrar esta corrección:

```bash
git switch -c fix/integracion-final-jobconnect
git add .
git commit -m "feat: agregar navegación desplegable y perfiles configurables"
git push -u origin fix/integracion-final-jobconnect
```

Después se debe crear un Pull Request hacia `main`, revisar que `npm test` finalice correctamente y resolver cualquier rama pendiente antes de entregar. No se deben subir `node_modules`, archivos `.env` ni tokens reales.

## Documentación académica

La carpeta `docs/` contiene planificación, arquitectura, bitácora de consultas, reflexión, evidencias de pruebas, material de infografía y guion del video. El enlace definitivo del video debe actualizarse después de grabarlo y publicarlo en el medio seleccionado por el equipo.

## Solución de problemas

- Si `npm start` indica que el puerto está ocupado, usa otro valor de `JOBCONNECT_PORT`.
- Si aparece un error de conexión, confirma que `https://dummyjson.com` sea accesible desde el navegador.
- Si la sesión parece inválida, cierra sesión o elimina las claves `jobconnect.token` y `jobconnect.user` de `localStorage`.
- Si los cambios desaparecen al recargar, es el comportamiento esperado de las operaciones simuladas de DummyJSON.


### Animación BlurText del hero

La animación original de entrada y desplazamiento de las palabras del hero fue reemplazada por una implementación equivalente a `BlurText`, usando Motion para Web y un retraso de 200 ms entre palabras. Para instalar la dependencia:

```bash
npm install motion
```

La implementación está en `src/js/animations/blur-text.js` y se inicializa desde `src/js/animations/home-motion.js`.
