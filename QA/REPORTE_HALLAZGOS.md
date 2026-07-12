# Reporte de hallazgos — SIGDIM

Generado a partir de la suite Playwright en `QA/tests/`. Ejecutar `npm test` en `QA/` para reproducir.

## Estado por pantalla

| Pantalla | Estado | Cubierto por |
|---|---|---|
| Login | ⚠️ Sin validación real / 🐛 rol no persiste | `tests/ui/auth.spec.ts` |
| Navegación (sidebar + logout) | ✅ Funcional (sin URLs) | `tests/ui/navigation.spec.ts` |
| Dashboard | ✅ Renderizado / ⚠️ "Nuevo Expediente" decorativo | `tests/ui/dashboard.spec.ts` |
| Expedientes (lista) | ✅ Búsqueda y filtros reales / ⚠️ Exportar, Nuevo, paginación decorativos | `tests/ui/expedientes.spec.ts` |
| Modal de expediente | ✅ Tabs, PDF, cerrar reales / ⚠️ Subir doc, notas, actualizar estado decorativos / 🐛 Escape no cierra | `tests/ui/expediente-modal.spec.ts` |
| Clientes | ✅ Renderizado / ⚠️ "Nuevo cliente" decorativo | `tests/ui/clientes.spec.ts` |
| Configuración | ⚠️ "Guardar cambios" no persiste nada | `tests/ui/configuracion.spec.ts` |
| Inicio (Solicitante) | ✅ Accesos rápidos reales / ⚠️ "Subir ahora" decorativo | `tests/ui/solicitante-inicio.spec.ts` |
| Mis Trámites | ✅ Acordeón real / ⚠️ Subir docs, contactar abogado decorativos | `tests/ui/mis-tramites.spec.ts` |
| Nuevo Trámite (wizard) | ✅ Navegación entre pasos real / 🐛 datos del paso 2 se pierden / ⚠️ "Enviar solicitud" resetea sin confirmar | `tests/ui/solicitar-tramite.spec.ts` |
| Oficinas | ✅ Filtros reales / ⚠️ "Ver en mapa", "Llamar" decorativos | `tests/ui/oficinas.spec.ts` |
| Ayuda | ✅ FAQ real / ⚠️ enlaces de recursos decorativos | `tests/ui/ayuda.spec.ts` |
| API backend | ✅ `/api/health` y 404 funcionan | `tests/api/health.spec.ts`, `tests/api/not-found.spec.ts` |

Leyenda: ✅ funcional · ⚠️ decorativo/no-op · 🐛 defecto real (comportamiento incorrecto, no solo ausente).

## Riesgos para producción

1. **Frontend y backend están completamente desconectados.** No existe ni una sola llamada `fetch`/`axios` desde `src/app/App.tsx` hacia `http://localhost:3000`. Todo el frontend opera sobre datos hardcodeados a nivel de módulo.
2. **El backend solo expone `/api/health`.** Pese a tener el schema Prisma completo (`Usuario`, `Expediente`, `Documento`, `HistorialEstado`, `Auditoria`, `RefreshToken`) y dependencias ya instaladas (`jsonwebtoken`, `bcryptjs`, `multer`), no hay ni una ruta de negocio implementada.
3. **Roles incompletos.** El enum `Rol` del backend define 4 valores (`SOLICITANTE`, `ABOGADO`, `FUNCIONARIO`, `ADMINISTRADOR`); el frontend solo tiene pantallas para 2 (`abogado`, `solicitante`). No existe ninguna interfaz para funcionario o administrador.
4. **El login no autentica nada.** Cualquier combinación de credenciales (incluso vacías) inicia sesión; el rol no persiste ni siquiera en `localStorage`, así que cualquier recarga de página vuelve al login.
5. **Bug de pérdida de datos en el wizard "Nuevo Trámite".** Los 8 campos del paso 2 son inputs no controlados sin `value` ni `onChange`; el resumen del paso 3 siempre muestra los mismos datos hardcodeados de ejemplo (`James William Scott`, etc.) sin importar lo que el usuario haya escrito. Confirmado por el test `BUG: el resumen del paso 3 no refleja los datos ingresados por el usuario`.
6. **"Enviar solicitud" da una falsa sensación de éxito.** Al hacer clic simplemente resetea el wizard al paso 1 sin mostrar ningún mensaje de confirmación ni error — el usuario no tiene forma de saber si "funcionó". Además, el reseteo es incompleto: solo llama a `setStep(1)`, nunca limpia el tipo de trámite seleccionado (`selected`), por lo que "Continuar" queda habilitado de inmediato y un reenvío accidental usaría el estado previo.
7. **`README.md` de la raíz está desactualizado.** Describe un backend con Sequelize + SQLite y rutas (`/api/auth/register`, `/api/solicitudes`, etc.) que no existen en el código actual (Prisma + PostgreSQL, solo `/api/health`).
8. **Sin persistencia de ningún dato ingresado por el usuario** en ninguna pantalla (Configuración, Notas del expediente, formulario del wizard) — todos los "guardar" son decorativos o, en el mejor caso, solo cambian estado local que se pierde al desmontar el componente.

## Qué conectar antes de producción (orden sugerido por impacto)

1. Implementar autenticación real en el backend (login/registro, JWT) y conectarla al `LoginScreen` del frontend.
2. Implementar los endpoints CRUD de `Expediente`/`Documento`/`HistorialEstado` y reemplazar los arrays hardcodeados del frontend por llamadas reales a la API.
3. Arreglar el formulario del wizard "Nuevo Trámite" para que sea controlado (`useState` + `value`/`onChange`) y que el resumen del paso 3 refleje los datos reales; conectar "Enviar solicitud" a un endpoint real con confirmación visible.
4. Diseñar y construir las pantallas de `FUNCIONARIO` y `ADMINISTRADOR`.
5. Persistir la sesión (rol + token) en `localStorage`/cookies para sobrevivir recargas de página.
6. Actualizar `README.md` para reflejar la arquitectura real (Prisma/PostgreSQL, endpoints existentes).
7. Conectar los botones actualmente decorativos (subir documento, exportar, nuevo cliente/expediente, guardar configuración) a sus respectivos endpoints una vez existan.
