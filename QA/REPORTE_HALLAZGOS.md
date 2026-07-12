# Reporte de hallazgos — SIGDIM

Generado a partir de la suite Playwright en `QA/tests/`. Ejecutar `npm test` en `QA/` para reproducir.

## Estado por pantalla

| Pantalla | Estado | Cubierto por |
|---|---|---|
| Login | ⚠️ Sin validación real / 🐛 rol no persiste | `tests/ui/auth.spec.ts` |
| Navegación (sidebar + logout) | ✅ Funcional (sin URLs) | `tests/ui/navigation.spec.ts` |
| Dashboard | ✅ Renderizado / ⚠️ "Nuevo Expediente" decorativo | `tests/ui/dashboard.spec.ts` |
| Expedientes (lista) | ✅ Búsqueda y filtros reales / ⚠️ Exportar, Nuevo, paginación decorativos | `tests/ui/expedientes.spec.ts` |
| Modal de expediente | ✅ Tabs, PDF, cerrar, subir documento y actualizar estado reales (persisten contra el backend) / ⚠️ notas decorativo / 🐛 Escape no cierra | `tests/ui/expediente-modal.spec.ts` |
| Clientes | ✅ Renderizado / ⚠️ "Nuevo cliente" decorativo | `tests/ui/clientes.spec.ts` |
| Configuración | ⚠️ "Guardar cambios" no persiste nada | `tests/ui/configuracion.spec.ts` |
| Inicio (Solicitante) | ✅ Accesos rápidos reales / ⚠️ "Subir ahora" decorativo | `tests/ui/solicitante-inicio.spec.ts` |
| Mis Trámites | ✅ Acordeón real / ⚠️ Subir docs, contactar abogado decorativos | `tests/ui/mis-tramites.spec.ts` |
| Nuevo Trámite (wizard) | ✅ Navegación entre pasos real / 🐛 datos del paso 2 se pierden / ⚠️ "Enviar solicitud" resetea sin confirmar | `tests/ui/solicitar-tramite.spec.ts` |
| Oficinas | ✅ Filtros reales / ⚠️ "Ver en mapa", "Llamar" decorativos | `tests/ui/oficinas.spec.ts` |
| Ayuda | ✅ FAQ real / ⚠️ enlaces de recursos decorativos | `tests/ui/ayuda.spec.ts` |
| API backend | ✅ `/api/health` y 404 funcionan | `tests/api/health.spec.ts`, `tests/api/not-found.spec.ts` |
| Registro de solicitante | ✅ Registro real contra el backend, validación de contraseña, manejo de correo duplicado (409) | `tests/ui/registro.spec.ts` |
| Representación (asignar/revocar abogado) | ✅ Flujo real de asignar abogado por licencia, permisos, ver "Mi Abogado" y revocar | `tests/ui/representacion.spec.ts` |

Leyenda: ✅ funcional · ⚠️ decorativo/no-op · 🐛 defecto real (comportamiento incorrecto, no solo ausente).

> Nota: `registro.spec.ts` y `representacion.spec.ts` cubren funcionalidad agregada después de la construcción inicial de esta suite (Tareas 1-16) por otro desarrollo en paralelo; no fueron escritos como parte de ese plan, pero se incluyen aquí porque ya forman parte de la suite completa (65/65 pruebas pasando).

## Riesgos para producción

1. **Frontend y backend ya están parcialmente conectados, pero de forma desigual.** Registro de solicitante, asignar/revocar abogado, subir documento y actualizar estado de un expediente ya llaman al backend real. El resto de la pantallas (Dashboard, Expedientes, Clientes, Mis Trámites, wizard de Nuevo Trámite, Oficinas) sigue operando sobre datos hardcodeados a nivel de módulo, sin ninguna llamada al backend.
2. **El login del panel Abogado sigue siendo una simulación.** Cualquier credencial "funciona" en el `LoginScreen` visible; para que "Subir documentos" y "Actualizar estado" persistan de verdad, la app autentica en segundo plano contra el backend con una cuenta de abogado sembrada por el seed (`abogado@sigdim.gov.pa`) — si el seed no se ha corrido en el ambiente, esos dos botones quedan deshabilitados silenciosamente (sin ningún mensaje visible para el usuario que explique por qué). El backend ya expone rutas de negocio reales (`auth`, `representaciones`, `usuarios`, `expedientes`) además de `/api/health`.
3. **Roles incompletos.** El enum `Rol` del backend define 4 valores (`SOLICITANTE`, `ABOGADO`, `FUNCIONARIO`, `ADMINISTRADOR`); el frontend solo tiene pantallas para 2 (`abogado`, `solicitante`). No existe ninguna interfaz para funcionario o administrador.
4. **El login no autentica nada.** Cualquier combinación de credenciales (incluso vacías) inicia sesión; el rol no persiste ni siquiera en `localStorage`, así que cualquier recarga de página vuelve al login.
5. **Bug de pérdida de datos en el wizard "Nuevo Trámite".** Los 8 campos del paso 2 son inputs no controlados sin `value` ni `onChange`; el resumen del paso 3 siempre muestra los mismos datos hardcodeados de ejemplo (`James William Scott`, etc.) sin importar lo que el usuario haya escrito. Confirmado por el test `BUG: el resumen del paso 3 no refleja los datos ingresados por el usuario`.
6. **"Enviar solicitud" da una falsa sensación de éxito.** Al hacer clic simplemente resetea el wizard al paso 1 sin mostrar ningún mensaje de confirmación ni error — el usuario no tiene forma de saber si "funcionó". Además, el reseteo es incompleto: solo llama a `setStep(1)`, nunca limpia el tipo de trámite seleccionado (`selected`), por lo que "Continuar" queda habilitado de inmediato y un reenvío accidental usaría el estado previo.
7. **`README.md` de la raíz ya fue actualizado** (describe correctamente Express + Prisma + PostgreSQL) — este riesgo ya no aplica.
8. **Sin persistencia de datos en las pantallas que aún no están conectadas** (Configuración, Notas del expediente, formulario del wizard) — esos "guardar" siguen siendo decorativos o solo cambian estado local que se pierde al desmontar el componente. Esto ya no aplica a Documentos/Estado del expediente, Registro ni Representación, que sí persisten en Postgres.

## Qué conectar antes de producción (orden sugerido por impacto)

1. ✅ Hecho — Registro real de solicitante, y subir documento / actualizar estado del expediente ya persisten contra el backend.
2. Conectar el `LoginScreen` del panel Abogado a autenticación real (hoy cualquier credencial "funciona" visualmente; el token real se obtiene en segundo plano con una cuenta sembrada, sin que el usuario lo perciba).
3. Implementar los endpoints CRUD restantes (listado real de `Expediente`, `Notas`) y reemplazar los arrays hardcodeados del Dashboard/Expedientes/Clientes/Mis Trámites/wizard/Oficinas por llamadas reales a la API.
4. Arreglar el formulario del wizard "Nuevo Trámite" para que sea controlado (`useState` + `value`/`onChange`) y que el resumen del paso 3 refleje los datos reales; conectar "Enviar solicitud" a un endpoint real con confirmación visible.
5. Diseñar y construir las pantallas de `FUNCIONARIO` y `ADMINISTRADOR`.
6. Persistir la sesión (rol + token) en `localStorage`/cookies para sobrevivir recargas de página.
7. ✅ Hecho — `README.md` ya refleja la arquitectura real (Prisma/PostgreSQL, endpoints existentes).
8. Conectar los botones que siguen decorativos (exportar, nuevo cliente/expediente, guardar configuración, notas del expediente) a sus respectivos endpoints una vez existan.
9. Documentar el requisito de correr `npm run prisma:seed` en cualquier ambiente nuevo — si no se corre, "Subir documentos" y "Actualizar estado" quedan deshabilitados sin ningún aviso visible al usuario.
