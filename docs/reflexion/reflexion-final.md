# Reflexión final sobre el apoyo de NotebookLM

## Planificación

NotebookLM permitió organizar el enunciado en una matriz de recursos, métodos HTTP, autenticación y entregables. Esta separación ayudó a identificar que Candidatos y Vacantes necesitaban tanto PUT como PATCH, mientras que los demás módulos tenían combinaciones diferentes.

## Desarrollo

Las consultas técnicas se utilizaron como apoyo para distinguir PUT de PATCH, comprender el header Bearer, trabajar con `async/await` y reconocer que DummyJSON simula las mutaciones. Sin embargo, las respuestas de una herramienta no reemplazan la ejecución del código. La primera integración tenía rutas POST incompletas, un contrato de menú mal utilizado y un error común en los eventos de formulario.

## Validación

La revisión demostró la importancia de contrastar la documentación con pruebas automáticas. Se creó una matriz verificable para los seis módulos y pruebas que recorren login, navegación, perfil por tipo de cuenta, botones, formularios, métodos HTTP y servidor Node. Esto permitió corregir afirmaciones anteriores de listas de verificación que indicaban funciones aprobadas aunque todavía existían fallos de ejecución.

## Cierre

NotebookLM puede apoyar el guion, la infografía y la explicación de la arquitectura, pero el equipo conserva la responsabilidad de revisar cada fuente, probar el navegador y demostrar la aplicación real. El aprendizaje principal fue combinar investigación, control de versiones, revisión humana y pruebas reproducibles antes de considerar finalizada una integración.
