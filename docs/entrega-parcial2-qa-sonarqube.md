# Qué sacar de SonarQube y de las pruebas QA para la entrega del Parcial 2

Este documento resume, en base a las indicaciones de la profesora ("Indicaciones del Proyecto Semestral – Cierre del Curso"), **específicamente qué evidencias hay que extraer de SonarQube y de la suite de QA (Playwright)** para el punto **3. Evidencias del Software** del documento final (reportes de pruebas + métricas ISTQB/TMMi/TQM), y para el punto **b. Adecuaciones del Parcial 2** (defectos corregidos, métricas aplicadas).

## 1. Dónde encaja cada cosa en el entregable

| Pide la profesora | Se cubre con |
|---|---|
| Reportes de pruebas 🧪 | Reporte HTML de Playwright (`QA/playwright-report`) |
| Métricas aplicadas (ISTQB – TMMi – TQM) 📊 | Métricas de ejecución de QA (aprobados/fallidos, defectos) + métricas de calidad de código de SonarQube |
| Qué defectos se corrigieron ✅ (sección b) | Historial de bugs encontrados por Playwright/Sonar y su resolución (issues cerrados, commits de fix) |
| Qué decisiones técnicas tomaron y por qué 💡 | Justificar por qué se usó Playwright para UI y SonarQube para calidad estática |
| Capturas del sistema 📸 | Capturas del dashboard de SonarQube + del reporte de Playwright |

## 2. Estado actual verificado (11-jul-2026)

- **SonarQube**: corriendo en `http://localhost:9000`, versión `26.6.0.123539`, status `UP`. Todavía **no hay ningún proyecto creado** en la instancia (no aparece en `/api/projects/search`) y las credenciales `admin/admin` ya no son válidas (401) — o sea que ya se cambió el password por defecto y hay que iniciar sesión manualmente en el navegador para generar un token.
- **QA (Playwright)**: proyecto `sigdim-qa` en la carpeta `QA/`, con 5 specs ya escritos y commiteados:
  - `tests/ui/auth.spec.ts` – login
  - `tests/ui/navigation.spec.ts` – navegación del sidebar y logout
  - `tests/ui/dashboard.spec.ts` – dashboard del abogado
  - `tests/ui/expedientes.spec.ts` – listado/búsqueda/filtros de expedientes
  - `tests/ui/expediente-modal.spec.ts` – modal de expediente (tabs, descarga PDF, no-ops)
  - Ya existe un `QA/playwright-report/index.html` generado por una corrida previa (`test-results/.last-run.json`).
- El frontend es Vite/React (`package.json` raíz) y el backend es Node/Express + Prisma (`backend/package.json`). Ninguno de los dos tiene todavía config de cobertura (`nyc`, `c8`, `vitest --coverage`, etc.) ni `sonar-project.properties`.

## 3. Qué falta hacer para tener evidencia real de SonarQube

1. **Entrar a `http://localhost:9000`** con tu usuario/contraseña actuales (no `admin/admin`).
2. **Crear un proyecto manual** (botón "Create Project" → Manually), un nombre tipo `sigdim` o uno por componente (`sigdim-frontend`, `sigdim-backend`).
3. **Generar un token** de análisis (Account → Security → Generate Token) — se necesita para correr el scanner desde la terminal.
4. **Instalar y correr `sonar-scanner`** (o `sonarqube-scanner` vía npm) apuntando a `src/` y `backend/src/`, excluyendo `node_modules`. Ejemplo mínimo de `sonar-project.properties` en la raíz:
   ```
   sonar.projectKey=sigdim
   sonar.sources=src,backend/src
   sonar.exclusions=**/node_modules/**,**/dist/**,QA/**
   sonar.host.url=http://localhost:9000
   sonar.login=<TOKEN_GENERADO>
   ```
5. **Correr el análisis** (`sonar-scanner` o `npx sonarqube-scanner`) y esperar a que procese.
6. **Capturar evidencia** del dashboard resultante: Quality Gate (Passed/Failed), Bugs, Vulnerabilities, Code Smells, Security Hotspots, Coverage %, Duplications %, Maintainability/Reliability/Security Rating (A-E), y Technical Debt estimado.

> Sin este paso 4-6, en la instancia actual **no hay ninguna métrica de SonarQube que capturar todavía** — solo está el servidor levantado, no hay análisis corrido.

## 4. Cómo mapear las métricas de SonarQube a ISTQB / TMMi / TQM (para la sección de "métricas aplicadas")

| Métrica de SonarQube | Marco de referencia | Cómo se redacta en el documento |
|---|---|---|
| Bugs / Reliability Rating | ISTQB (defectos) | Densidad de defectos detectados estáticamente por KLOC |
| Vulnerabilities / Security Rating | TQM (calidad del producto) | Nivel de riesgo de seguridad del código |
| Code Smells / Maintainability Rating | TMMi (madurez del proceso, mantenibilidad) | Deuda técnica y su impacto en el proceso de mantenimiento |
| Coverage % | ISTQB (cobertura de pruebas) | % de código cubierto por pruebas automatizadas (si se agrega) |
| Duplications % | TQM | Indicador de eficiencia/calidad del código reutilizado |
| Quality Gate (Passed/Failed) | TMMi (nivel 3-4, control de calidad) | Criterio de aceptación antes de release |

## 5. Qué sacar de la suite de Playwright (reportes de pruebas)

- **Resumen de ejecución**: correr `npm run test` dentro de `QA/` y capturar el resumen final (X passed, Y failed, Z skipped) que imprime el reporter `list`.
- **Reporte HTML**: `npm run report` abre `playwright-report/index.html` — capturas de:
  - Vista general con el número total de specs/tests y su estado (verde/rojo).
  - Detalle de al menos un test con sus pasos (para mostrar trazabilidad).
  - Si algún test falla, el trace viewer con el screenshot del punto de fallo (evidencia de defecto encontrado).
- **Métricas ISTQB a reportar**:
  - % de casos ejecutados vs. planificados.
  - % de casos aprobados vs. fallidos.
  - Defectos encontrados y su severidad (login, navegación, dashboard, expedientes, modal).
  - Cobertura funcional: qué módulos del sistema quedaron cubiertos por los 5 specs (login/auth, navegación/logout, dashboard abogado, listado de expedientes, modal de expediente).

## 6. Checklist de capturas a reunir para el anexo del documento

- [ ] Captura del dashboard de SonarQube con el Quality Gate y las 6 métricas principales (Bugs, Vulnerabilities, Code Smells, Coverage, Duplications, Security Hotspots).
- [ ] Captura del detalle de un issue relevante (bug o code smell) corregido, mostrando el "antes/después" si aplica.
- [ ] Captura del reporte HTML de Playwright con el resumen de los 5 specs.
- [ ] Captura de un test individual expandido mostrando sus pasos.
- [ ] (Opcional pero recomendado) Captura del trace viewer de un fallo real, si lo hay, como evidencia de defecto detectado y su corrección posterior.
- [ ] Tabla resumen de métricas (armar en el documento final) combinando SonarQube + Playwright.

## 7. Pendientes para completar esta evidencia

- Iniciar sesión en SonarQube con las credenciales actuales del usuario (no `admin/admin`).
- Crear el/los proyecto(s), generar el token y correr el primer análisis (`sonar-scanner`).
- Correr `npm run test` en `QA/` con el frontend y backend levantados para regenerar el reporte HTML actualizado.
- Tomar las capturas del checklist anterior y anexarlas al documento final en PDF.
