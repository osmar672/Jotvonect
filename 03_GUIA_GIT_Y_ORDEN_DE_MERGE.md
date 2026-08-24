# Guía Git de JobConnect para dos integrantes

Seguir este orden evita que los dos agentes modifiquen los mismos archivos.

## 1. Fusionar primero la base

El Integrante 2 ejecuta el Prompt 0:

    git switch main
    git pull origin main
    git switch -c chore/base-jobconnect-dos-integrantes

Después:

    git status
    git add .
    git commit -m "chore: crear base de JobConnect para dos integrantes"
    git push -u origin chore/base-jobconnect-dos-integrantes

Crear Pull Request y fusionarlo con main.

Ningún integrante debe comenzar su funcionalidad antes de este merge.

## 2. Crear ramas desde el mismo main

### Integrante 1

    git switch main
    git pull origin main
    git switch -c feature/i1-auth-candidatos-entrevistas-tareas

### Integrante 2

    git switch main
    git pull origin main
    git switch -c feature/i2-ui-core-vacantes-empresas-postulaciones

## 3. Propiedad de trabajo

| Área | Responsable |
|---|---|
| Login y autenticación | Integrante 1 |
| Candidatos | Integrante 1 |
| Entrevistas | Integrante 1 |
| Tareas | Integrante 1 |
| Planificación | Integrante 1 |
| Infografía | Integrante 1 |
| Reflexión | Integrante 1 |
| index.html y shell | Integrante 2 |
| Perfil y preferencias por cuenta | Integrante 2 |
| Inicio, animaciones y estilos interactivos | Integrante 2 |
| API, feedback y errores | Integrante 2 |
| Vacantes | Integrante 2 |
| Empresas | Integrante 2 |
| Postulaciones | Integrante 2 |
| app.js e integración | Integrante 2 |
| Repositorio | Integrante 2 |
| README, video y bitácora | Integrante 2 |
| Contratos | Congelados después de la base |

## 4. Revisar cada commit

Antes de hacer commit:

    git status
    git diff --name-only

Si aparece un archivo ajeno:

1. No incluirlo.
2. Identificar por qué cambió.
3. Registrar la solicitud.
4. Pedir al dueño que haga el ajuste.

No usar git reset --hard. No hacer push forzado a main.

## 5. Pull Request del Integrante 1

Antes de publicarlo:

    git fetch origin
    git rebase origin/main
    git push -u origin feature/i1-auth-candidatos-entrevistas-tareas

Revisar que el Pull Request contenga únicamente sus rutas.

Orden sugerido de commits:

1. Autenticación.
2. Candidatos.
3. Entrevistas.
4. Tareas.
5. Documentos.

Fusionar este Pull Request antes del Pull Request final del Integrante 2.

## 6. Rebase final del Integrante 2

Cuando el Integrante 1 ya esté en main:

    git switch feature/i2-ui-core-vacantes-empresas-postulaciones
    git fetch origin
    git rebase origin/main

Después:

- Completar imports de app.js.
- Integrar auth-service.
- Registrar los seis módulos.
- Probar navegación.
- Probar logout.
- Modificar solamente archivos propios.

Publicar:

    git push -u origin feature/i2-ui-core-vacantes-empresas-postulaciones

Si la rama ya estaba publicada después del rebase:

    git push --force-with-lease

Nunca utilizar --force sin --force-with-lease.

## 7. Orden de Pull Requests

1. chore/base-jobconnect-dos-integrantes
2. feature/i1-auth-candidatos-entrevistas-tareas
3. feature/i2-ui-core-vacantes-empresas-postulaciones

## 8. Conflictos

### En un archivo propio

Resolver conservando el contrato:

    git add ARCHIVO_RESUELTO
    git rebase --continue

### En un archivo del otro integrante

No elegir ours ni theirs automáticamente:

    git rebase --abort

Revisar por qué la rama tocó un archivo no autorizado.

## 9. Validación final

### Git

- Los dos integrantes aparecen en el historial.
- No hay trabajo directo en main.
- No existen servicios duplicados.
- No hay archivos copia o final-final.
- No hay credenciales ni tokens.
- Todos los entregables están versionados.

### Aplicación

- Login correcto e incorrecto.
- Token guardado.
- Protección sin sesión.
- Logout.
- Navegación por seis módulos.
- Candidatos: GET, POST, PUT, PATCH y DELETE.
- Vacantes: GET, POST, PUT, PATCH y DELETE.
- Empresas: GET, POST, PUT y DELETE.
- Postulaciones: GET, POST, PATCH y DELETE.
- Entrevistas: GET, POST, PATCH y DELETE.
- Tareas: GET, POST, PATCH y DELETE.
- Carga, errores y lista vacía.
- Confirmación de DELETE.
- Estado local de DummyJSON.
- Computadora, tablet y teléfono.
- Consola sin errores.

### Entregables

- README.
- Planificación.
- Infografía.
- Video.
- Reflexión.
- Bitácora.
- Evidencias de NotebookLM.
- Enlace del repositorio.

## 10. Regla final

El Integrante 1 entrega autenticación y sus tres módulos como componentes completos. El Integrante 2 los consume mediante imports y los integra desde app.js, sin reescribir su lógica.
