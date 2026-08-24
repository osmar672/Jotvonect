# Reglas de integración

- Cada archivo tiene un único responsable.
- Ningún integrante edita archivos ajenos.
- Los módulos se comunican únicamente mediante el contrato `mount`/`unmount` y `services`.
- `app.js` es el único archivo que registra los seis módulos.
- El Integrante 1 no debe importar `app.js`, `shell`, `api-client` ni `feedback`.
- El Integrante 2 no debe modificar internamente `auth` ni los tres módulos del Integrante 1.
- No se deben crear duplicados como `auth2.js`, `api-final.js` o `app-copia.js`.
- No se deben renombrar ni mover carpetas ajenas.
- No se debe aplicar formateo global al repositorio.
- Cada CSS de módulo utiliza una clase raíz propia.
- Los cambios simulados por DummyJSON se reflejan mediante estado local.
- Las solicitudes de cambios externos se anotan en el documento de pruebas del responsable.

## Identificadores oficiales

| Módulo | ID | Endpoint |
| --- | --- | --- |
| Candidatos | `candidates` | `/users` |
| Entrevistas y notas | `interviews` | `/comments` |
| Tareas | `tasks` | `/todos` |
| Vacantes | `vacancies` | `/products` |
| Empresas clientes | `companies` | `/carts` |
| Postulaciones | `applications` | `/posts` |

