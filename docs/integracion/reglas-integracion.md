# Reglas de integración
1. Un archivo tiene un único responsable.
2. Ningún integrante edita archivos ajenos.
3. Los módulos usan únicamente `mount/unmount` y `services`.
4. `app.js` registra los seis módulos.
5. No se crean duplicados de servicios.
6. Los cambios simulados por DummyJSON se reflejan en el estado local.
7. Conflictos de archivos ajenos se resuelven revisando propiedad antes de editar.