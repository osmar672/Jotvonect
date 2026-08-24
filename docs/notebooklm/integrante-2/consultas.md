# Consultas de NotebookLM — Integrante 2

Las siguientes consultas están preparadas para ejecutarse o verificarse en NotebookLM con el enunciado, el contrato y la documentación del repositorio como fuentes. La síntesis indica el criterio aplicado en el código y no sustituye la evidencia exportada de NotebookLM.

## Arquitectura

- Consulta: ¿Qué patrón permite registrar seis módulos independientes y compartir API, feedback y autenticación sin imports cruzados?
- Síntesis aplicada: composición en `app.js`, inyección de `services` y ciclo de vida `mount`/`unmount`.
- Evidencia NotebookLM: pendiente de enlace o captura.

## Navegación

- Consulta: ¿Qué requisitos de accesibilidad debe cumplir un menú de módulos construido con botones?
- Síntesis aplicada: HTML semántico, foco visible, `aria-current`, Tab, flechas, Home y End.
- Evidencia NotebookLM: pendiente de enlace o captura.

## Responsividad

- Consulta: ¿Cómo adaptar un panel lateral a tablet y teléfono sin ocultar acciones?
- Síntesis aplicada: menú horizontal desplazable, formularios en una columna y acciones de ancho completo en teléfono.
- Evidencia NotebookLM: pendiente de enlace o captura.

## Errores

- Consulta: ¿Cómo normalizar errores de Fetch, respuestas HTTP fallidas y JSON inválido?
- Síntesis aplicada: una clase `AppError` con mensaje, código, estado y causa; la UI consume solamente el mensaje seguro.
- Evidencia NotebookLM: pendiente de enlace o captura.

## CORS

- Consulta: ¿Qué es CORS y cómo se diferencia de un error HTTP normal al consumir DummyJSON desde un servidor local?
- Síntesis aplicada: ejecutar mediante HTTP local, no intentar evadir políticas del navegador y mostrar un error de red normalizado.
- Evidencia NotebookLM: pendiente de enlace o captura.

## Git

- Consulta: ¿Cuál es el orden seguro para integrar dos Pull Requests con propiedad exclusiva de archivos?
- Síntesis aplicada: integrar primero al Integrante 1, actualizar la rama del Integrante 2 con `fetch` y `rebase`, resolver solo archivos propios y abrir el segundo Pull Request.
- Evidencia NotebookLM: pendiente de enlace o captura.

## README

- Consulta: ¿Qué debe explicar un README para que otra persona ejecute, pruebe y mantenga JobConnect?
- Síntesis aplicada: objetivo, tecnologías, estructura, servidor local, autenticación, módulos, estado local, ramas, uso y entregables.
- Evidencia NotebookLM: pendiente de enlace o captura.

## Video Overview

- Consulta: Genera un Video Overview de JobConnect que cubra login, seis módulos, CRUD, feedback, responsividad y repositorio en menos de nueve minutos.
- Síntesis aplicada: guion cronológico con demostraciones concretas y checklist de grabación.
- Evidencia NotebookLM: pendiente de enlace o captura.
