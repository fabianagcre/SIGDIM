# Suite de pruebas Playwright + reporte de hallazgos para SIGDIM

## Contexto

SIGDIM es un sistema de gestión de expedientes migratorios compuesto por:
- **Frontend**: Vite + React + TypeScript en la raíz del repo. Toda la app vive en un único archivo `src/app/App.tsx` (~1754 líneas), sin React Router (navegación por estado interno), sin llamadas al backend, y con datos completamente hardcodeados (arrays constantes a nivel de módulo).
- **Backend**: Express + Prisma + PostgreSQL en `backend/`, con modelos definidos (`Usuario`, `TipoTramite`, `Expediente`, `Documento`, `HistorialEstado`, `Auditoria`, `RefreshToken`) pero **solo un endpoint implementado**: `GET /api/health`. No hay rutas de auth, ni CRUD, pese a tener dependencias como `jsonwebtoken`, `bcryptjs`, `multer` ya instaladas.

El usuario pidió verificar el sistema completo con Playwright, cubriendo "todos los casos de prueba posibles", y crear una carpeta `pruebas/` con la suite completa, con el objetivo de poder "sacar este aplicativo correctamente" (i.e., tener claridad de qué está listo para producción y qué no).

Una exploración previa reveló que la mayoría de botones de acción (crear, guardar, subir, enviar, exportar, paginación) son decorativos — no tienen handler real. El usuario confirmó (vía preguntas de clarificación) que quiere:
1. Cobertura completa incluyendo pruebas que confirmen explícitamente los no-ops (no solo lo que funciona).
2. Pruebas de API de backend además de las de UI.
3. Un reporte de hallazgos (gaps) como documento de referencia para priorizar qué arreglar antes de producción.

## Arquitectura

`pruebas/` es un **proyecto Playwright autocontenido**, con su propio `package.json` y `playwright.config.ts`, siguiendo el mismo patrón que ya usa `backend/` (paquete npm independiente, no integrado al `pnpm-workspace.yaml` inerte de la raíz). Esto evita tocar el `package.json` del frontend, que es un export de Figma Make.

`playwright.config.ts` configura `webServer` con dos entradas:
1. Frontend: `npm run dev` ejecutado en la raíz del repo, esperando el puerto **5173**.
2. Backend: `npm run dev` ejecutado en `backend/`, esperando el puerto **3000**.

Playwright levanta ambos procesos automáticamente antes de correr las pruebas y los apaga al terminar (reutiliza servidores ya corrientes si detecta que el puerto ya está en uso, vía `reuseExistingServer: true`, útil ya que ambos servicios ya están corriendo en esta sesión).

Solo se configura el proyecto **Chromium** por ahora (rapidez, suficiente para una app de estado único sin comportamiento específico de motor de navegador). Se puede ampliar a Firefox/WebKit más adelante si se pide explícitamente.

Requisito previo para que las pruebas corran: contenedor Docker `sigdim-postgres` corriendo y `backend/.env` configurado (ya lo hicimos en esta sesión).

## Estructura de archivos

```
pruebas/
  package.json                     # @playwright/test como devDependency, scripts: test, test:ui, report
  playwright.config.ts
  tsconfig.json
  README.md                        # cómo instalar y correr la suite
  REPORTE_HALLAZGOS.md             # entregable de gap analysis (se escribe DESPUÉS de correr la suite)
  tests/
    helpers/
      auth.ts                      # loginAsAbogado(page) / loginAsSolicitante(page)
    ui/
      auth.spec.ts
      navigation.spec.ts
      dashboard.spec.ts
      expedientes.spec.ts
      expediente-modal.spec.ts
      clientes.spec.ts
      configuracion.spec.ts
      solicitante-inicio.spec.ts
      mis-tramites.spec.ts
      solicitar-tramite.spec.ts
      oficinas.spec.ts
      ayuda.spec.ts
    api/
      health.spec.ts
      not-found.spec.ts
```

## Catálogo de casos de prueba por spec

Convención de aserciones: cada `test.describe` de una pantalla agrupa primero los casos **funcionales** (comportamiento real verificable) y luego un bloque `"no-op / decorativo"` con casos que confirman explícitamente que la acción no cambia el estado observable (mismo texto/DOM antes y después del click) — esto documenta el gap como prueba pasante, no como fallo.

- **auth.spec.ts**: toggle de rol abogado/solicitante cambia el formulario visible; login con campos vacíos igual navega al portal correspondiente (documenta ausencia de validación); tras login, el rol no persiste en reload (recarga vuelve a login) — documentado como hallazgo, no como bug bloqueante.
- **navigation.spec.ts**: cada ítem del sidebar (4 en portal abogado, 5 en portal solicitante) cambia la vista visible y aplica el estado "activo" al ítem correspondiente; no hay cambio de URL en ningún caso (se documenta explícitamente).
- **dashboard.spec.ts**: las 4 tarjetas KPI, el gráfico de barras y el donut renderizan con datos; "Nuevo Expediente" es no-op.
- **expedientes.spec.ts**: búsqueda filtra filas por nombre/número; los pills de estado filtran la tabla; abrir una fila lleva al modal; "Exportar", "Nuevo expediente" y los botones de paginación son no-op.
- **expediente-modal.spec.ts**: los 3 tabs (Información/Documentos/Notas) cambian el contenido visible; "Descargar expediente" dispara una descarga real de PDF (se verifica el evento de descarga y el nombre de archivo); "Subir documento", el textarea+enviar de notas, y "Actualizar estado" son no-op.
- **clientes.spec.ts**: grid de tarjetas de cliente renderiza con los datos hardcodeados; "Nuevo cliente" es no-op.
- **configuracion.spec.ts**: los inputs muestran valores por defecto; "Guardar cambios" es no-op (se verifica que no hay mensaje de confirmación ni cambio persistente tras reload).
- **solicitante-inicio.spec.ts**: stepper de 5 pasos renderiza el estado activo correcto; los 4 accesos rápidos navegan a la vista correspondiente; "Subir ahora" es no-op.
- **mis-tramites.spec.ts**: acordeón expande/colapsa cada trámite; "Subir documentos" y "Contactar abogado" son no-op.
- **solicitar-tramite.spec.ts** (el más crítico): paso 1 selecciona tipo de trámite y habilita "Continuar" solo tras selección; paso 2 — **caso de bug, no solo no-op**: se escriben valores en los 8 campos y se verifica que el paso 3 (resumen) NO refleja lo escrito (muestra datos hardcodeados distintos) — esta prueba falla intencionalmente en rojo para documentar el defecto, o se escribe como `test.fail()`/anotación explícita para que no rompa el pipeline; "Enviar solicitud" es no-op (vuelve a paso 1 sin confirmación real).
- **oficinas.spec.ts**: pills de filtro por tipo de oficina filtran las tarjetas; "Ver en mapa" y "Llamar" son no-op.
- **ayuda.spec.ts**: acordeón de FAQ expande/colapsa (real, 5 preguntas); tarjetas de contacto renderizan; enlaces de "Recursos útiles" son no-op.
- **health.spec.ts**: `GET /api/health` responde 200 con `{status:"ok", service:"sigdim-api"}`; header CORS refleja `FRONTEND_URL`.
- **not-found.spec.ts**: ruta inexistente responde 404 con `{message:"Ruta no encontrada"}`.

## Reporte de hallazgos (`pruebas/REPORTE_HALLAZGOS.md`)

Escrito después de implementar y correr la suite (para basarse en resultados reales, no en suposiciones). Estructura:
1. Tabla por pantalla: Estado (✅ funcional / ⚠️ decorativo / 🐛 bug / 🚧 no implementado), qué prueba lo cubre.
2. Sección "Riesgos para producción": roles `FUNCIONARIO`/`ADMINISTRADOR` sin UI; frontend y backend completamente desconectados (sin fetch/axios en el frontend); backend sin endpoints de negocio (solo health check) pese a tener el schema Prisma completo; `README.md` raíz desactualizado (describe un backend Sequelize/SQLite que ya no existe); bug del wizard "Nuevo Trámite" (no captura datos del formulario).
3. Lista priorizada de qué conectar/arreglar antes de producción (sugerencia ordenada por impacto, no vinculante).

## Verificación

1. `cd pruebas && npm install && npx playwright install chromium`
2. `npm test` — corre toda la suite contra frontend+backend levantados automáticamente por `webServer`.
3. Confirmar que el reporte HTML de Playwright (`npx playwright show-report`) muestra los specs de UI y API, con los casos no-op en verde (confirmando el gap) y el caso de bug del wizard marcado explícitamente.
4. Revisar `pruebas/REPORTE_HALLAZGOS.md` generado y contrastarlo manualmente contra 2-3 pantallas para confirmar que la clasificación (funcional/decorativo/bug) es precisa.
