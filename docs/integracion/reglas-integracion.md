# Reglas de integración
1. Un archivo tiene un único responsable.
2. Ningún integrante edita archivos ajenos.
3. Los módulos usan únicamente `mount/unmount` y `services`.
4. `app.js` registra Inicio y los seis módulos de gestión.
5. `shell.js` es el único responsable de abrir y cerrar los paneles de navegación y perfil.
6. `profile-service.js` conserva las preferencias por usuario sin mezclarlas con el token.
7. No se crean duplicados de servicios.
8. Los cambios simulados por DummyJSON se reflejan en el estado local.
9. Conflictos de archivos ajenos se resuelven revisando propiedad antes de editar.
