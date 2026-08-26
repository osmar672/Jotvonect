# Reporte de pruebas automatizadas

Fecha de ejecución: 24 de agosto de 2026.

## Resultado

- Pruebas ejecutadas: 26.
- Pruebas aprobadas: 26.
- Pruebas fallidas: 0.
- Validaciones estructurales: 131 aprobadas.

## Cobertura funcional

1. Autenticación, token, usuario, protección y logout.
2. Cliente API con GET, POST, PUT, PATCH, DELETE y Bearer token.
3. Rutas correctas de creación terminadas en `/add`.
4. Inicio y seis módulos de gestión registrados en el menú sin valores `undefined`.
5. Carga inicial y renderizado de registros.
6. Envío de los seis formularios POST.
7. PUT y PATCH de Candidatos y Vacantes.
8. Métodos de actualización correspondientes a los otros cuatro módulos.
9. Modal propio de confirmación de DELETE, foco, Escape, fondo y ejecución segura.
10. Servidor Node, `/health`, archivos estáticos, 404 y 405.
11. Sintaxis e imports locales.
12. Contenido corporativo, ausencia de franjas, explorador accesible de seis estándares, navegación y limpieza de animaciones de Inicio.
13. Disponibilidad y configuración de GSAP, ScrollTrigger, Anime.js y Lenis, con efectos de scroll, puntero y movimiento continuo conectados.
14. Perfil por usuario, guardado, normalización, reinicio y separación de cuentas.
15. Campos condicionales para persona candidata, reclutador y empresa.
16. Navegación mediante panel, perfil desde el encabezado y cierre de sesión interno.
17. Tema claro/oscuro persistente y control accesible desde el encabezado.
18. Transiciones entre módulos, narrativa de scroll y progreso de estándares.
19. Skeletons, indicadores, ordenamiento, vistas y editor lateral compartidos por los seis CRUD.
20. Porcentaje y vista previa dinámica del perfil.

## Alcance

Las pruebas de API utilizan respuestas controladas para ser repetibles y no modificar servicios externos. Antes de presentar se debe efectuar una demostración manual con Internet para validar la disponibilidad de DummyJSON en la red del equipo.
