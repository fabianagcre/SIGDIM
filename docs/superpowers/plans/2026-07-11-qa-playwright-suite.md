# Suite QA (Playwright) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained Playwright test suite in `QA/` covering every screen of the SIGDIM frontend (UI) and the two real backend endpoints (API), including tests that explicitly confirm known no-op/decorative buttons and one that documents a real data-loss bug in the "Nuevo Trámite" wizard — then produce `QA/REPORTE_HALLAZGOS.md` summarizing findings for production readiness.

**Architecture:** `QA/` is an independent npm package (own `package.json`, `playwright.config.ts`), matching the existing pattern of `backend/` being a standalone package outside the root `pnpm-workspace.yaml`. Playwright's `webServer` option boots both the frontend (`npm run dev` at repo root, port 5173) and the backend (`npm run dev` in `backend/`, port 3000) automatically before tests run, reusing them if already running.

**Tech Stack:** `@playwright/test` (Chromium project only), TypeScript, no other runtime dependency.

## Global Constraints

- All QA commands run from the `QA/` directory unless stated otherwise.
- Frontend dev server: Vite at `http://localhost:5173` (repo root, `npm run dev`, confirmed no `server.port` override in `vite.config.ts`).
- Backend dev server: Express at `http://localhost:3000` (`backend/`, `npm run dev`). Confirmed via `backend/src/server.js` and `backend/src/config/env.js` that startup only *validates the presence* of `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` env vars — it never connects to Postgres at boot, and `backend/src/app.js` has no Prisma-touching routes yet. So the suite does **not** require the `sigdim-postgres` Docker container to be running, only `backend/.env` to exist with those three keys set (already created earlier in this session).
- The frontend has **no `data-testid` attributes anywhere** and **no client-side routing** (confirmed: no react-router usage in `src/app/App.tsx` despite it being a dependency). All locators must use `getByRole` / `getByText` / `getByPlaceholder` against the exact real UI copy read directly from `src/app/App.tsx`. Never invent selectors or copy — every string used in a locator below was copied verbatim from that file.
- Use `{ exact: true }` on `getByRole(..., { name })` whenever a short label could be a substring of another simultaneously-rendered element's accessible name (concrete case: `"Cerrar"` vs `"Cerrar sesión"`, both present at once when the expediente modal is open).
- Tests that document a discovered defect (the wizard data-loss bug in Task 11) must assert the **current real behavior** explicitly, with a `BUG:` prefix in the test title and a one-line comment above the assertion explaining the defect. Do not use `test.fail()` or `test.skip()` — the suite must be 100% green today; it turning red later is the intended signal that someone fixed the bug.
- Only the Chromium project is configured (per approved spec) — no Firefox/WebKit.
- Every spec file task ends with running `npx playwright test tests/<path>.spec.ts --project=chromium` and confirming all tests in that file pass before moving on.

---

### Task 1: Scaffold the `QA/` Playwright project

**Files:**
- Create: `QA/package.json`
- Create: `QA/tsconfig.json`
- Create: `QA/playwright.config.ts`
- Create: `QA/.gitignore`

**Interfaces:**
- Produces: a working `npx playwright test` command runnable from `QA/`, with `webServer` auto-booting frontend (5173) and backend (3000), consumed by every later task's spec files via relative `page.goto('/')` calls (baseURL is set here).

- [ ] **Step 1: Create `QA/package.json`**

```json
{
  "name": "sigdim-qa",
  "private": true,
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0"
  }
}
```

- [ ] **Step 2: Create `QA/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["@playwright/test", "node"]
  }
}
```

- [ ] **Step 3: Create `QA/playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      cwd: '../backend',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
```

- [ ] **Step 4: Create `QA/.gitignore`**

```
node_modules/
test-results/
playwright-report/
blob-report/
playwright/.cache/
```

- [ ] **Step 5: Install dependencies and browsers**

Run: `cd QA && npm install && npx playwright install chromium --with-deps`
Expected: install completes with no errors; Chromium binary downloaded.

- [ ] **Step 6: Smoke-verify the config with zero tests**

Run: `npx playwright test`
Expected: output like `No tests found` (no `tests/` content yet) — confirms config parses and doesn't error, without yet booting the webServers (Playwright only starts `webServer` when there's at least one test to run, so this step just validates the config file itself; the real boot verification happens in Task 2).

- [ ] **Step 7: Commit**

```bash
git add QA/package.json QA/tsconfig.json QA/playwright.config.ts QA/.gitignore
git commit -m "test: scaffold QA Playwright project"
```

---

### Task 2: Auth helper + `auth.spec.ts` (login screen)

**Files:**
- Create: `QA/tests/helpers/auth.ts`
- Create: `QA/tests/ui/auth.spec.ts`

**Interfaces:**
- Produces: `loginAsAbogado(page: Page): Promise<void>` and `loginAsSolicitante(page: Page): Promise<void>`, both exported from `QA/tests/helpers/auth.ts`. Every later UI spec task imports one or both of these.
- Context: `src/app/App.tsx` `LoginScreen` (lines 158–305) defaults role state to `"abogado"` (line 159); the submit button has text **"Ingresar al sistema"** (idle) / **"Verificando..."** (loading, for ~1100ms per `setTimeout` at line 167); the role toggle button for the applicant portal has visible text **"Solicitante"**; there is no validation of any kind and no persistence of the logged-in role (root `App` component keeps `role` in plain `useState`, line 1750, reset on any reload).

- [ ] **Step 1: Write `QA/tests/helpers/auth.ts`**

```typescript
import { Page, expect } from '@playwright/test';

export async function loginAsAbogado(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ingresar al sistema' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
}

export async function loginAsSolicitante(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Solicitante' }).click();
  await page.getByRole('button', { name: 'Ingresar al sistema' }).click();
  await expect(page.getByRole('heading', { name: 'Bienvenida, María', exact: true })).toBeVisible();
}
```

- [ ] **Step 2: Write `QA/tests/ui/auth.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAbogado, loginAsSolicitante } from '../helpers/auth';

test.describe('Login', () => {
  test('muestra el formulario con el rol Abogado seleccionado por defecto', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Bienvenido' })).toBeVisible();
    await expect(page.getByPlaceholder('abogado@despacho.pa')).toBeVisible();
  });

  test('cambia el formulario al seleccionar el rol Solicitante', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Solicitante' }).click();
    await expect(page.getByPlaceholder('AB123456 o correo@email.com')).toBeVisible();
    await expect(page.getByText('Crear cuenta como solicitante')).toBeVisible();
  });

  test('permite iniciar sesión como abogado con campos vacíos (sin validación)', async ({ page }) => {
    await loginAsAbogado(page);
  });

  test('permite iniciar sesión como solicitante con campos vacíos (sin validación)', async ({ page }) => {
    await loginAsSolicitante(page);
  });

  test('el botón muestra el estado de carga "Verificando..." mientras autentica', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Ingresar al sistema' }).click();
    await expect(page.getByRole('button', { name: 'Verificando...' })).toBeVisible();
  });

  test('hallazgo: el rol no persiste tras recargar la página', async ({ page }) => {
    await loginAsAbogado(page);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Bienvenido' })).toBeVisible();
  });

  test('no-op: "¿Olvidaste tu contraseña?" no realiza ninguna acción', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click();
    await expect(page.getByRole('heading', { name: 'Bienvenido' })).toBeVisible();
    await expect(page).toHaveURL('/');
  });
});
```

- [ ] **Step 3: Run the spec**

Run: `npx playwright test tests/ui/auth.spec.ts --project=chromium`
Expected: `7 passed` (this run also validates the `webServer` boot for the first time — allow it extra time on first run).

- [ ] **Step 4: Commit**

```bash
git add QA/tests/helpers/auth.ts QA/tests/ui/auth.spec.ts
git commit -m "test: add login screen spec and shared auth helper"
```

---

### Task 3: `navigation.spec.ts`

**Files:**
- Create: `QA/tests/ui/navigation.spec.ts`

**Interfaces:**
- Consumes: `loginAsAbogado`, `loginAsSolicitante` from `../helpers/auth`.
- Context: `SidebarAbogado` (lines 316–353) renders 4 nav buttons with exact labels **"Dashboard", "Expedientes", "Clientes", "Configuración"** (`NAV_ABOGADO`, lines 309–314); active item gets `borderLeft: "3px solid #2980B9"` (line 330) → computed CSS `rgb(41, 128, 185)`. `SolicitanteNav` (lines 1050–1097) renders 5 nav buttons: **"Inicio", "Mis Trámites", "Nuevo Trámite", "Oficinas", "Ayuda"** (same active-border color, line 1074). Both sidebars have a **"Cerrar sesión"** button wired to a real `onLogout` callback that resets `role` to `null` in root `App` (line 1750-1753), returning to the login screen. Each abogado view renders an `<h1>` matching the nav label except plural/singular differences already covered by the exact literal headings below. No URL ever changes (confirmed no react-router usage).

- [ ] **Step 1: Write `QA/tests/ui/navigation.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAbogado, loginAsSolicitante } from '../helpers/auth';

test.describe('Navegación — portal Abogado', () => {
  test('cada ítem del sidebar cambia la vista y no cambia la URL', async ({ page }) => {
    await loginAsAbogado(page);

    const cases: Array<[string, string]> = [
      ['Expedientes', 'Expedientes'],
      ['Clientes', 'Clientes'],
      ['Configuración', 'Configuración'],
      ['Dashboard', 'Dashboard'],
    ];

    for (const [navLabel, heading] of cases) {
      const navButton = page.getByRole('button', { name: navLabel, exact: true });
      await navButton.click();
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      await expect(page).toHaveURL('/');
      await expect(navButton).toHaveCSS('border-left-color', 'rgb(41, 128, 185)');
    }
  });

  test('"Cerrar sesión" regresa a la pantalla de login', async ({ page }) => {
    await loginAsAbogado(page);
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page.getByRole('heading', { name: 'Bienvenido' })).toBeVisible();
  });
});

test.describe('Navegación — portal Solicitante', () => {
  test('cada ítem del sidebar cambia la vista y no cambia la URL', async ({ page }) => {
    await loginAsSolicitante(page);

    const cases: Array<[string, string]> = [
      ['Mis Trámites', 'Mis Trámites'],
      ['Nuevo Trámite', 'Solicitar Nuevo Trámite'],
      ['Oficinas', 'Oficinas del SNM'],
      ['Ayuda', 'Centro de Ayuda'],
      ['Inicio', 'Bienvenida, María'],
    ];

    for (const [navLabel, heading] of cases) {
      const navButton = page.getByRole('button', { name: navLabel, exact: true });
      await navButton.click();
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      await expect(page).toHaveURL('/');
      await expect(navButton).toHaveCSS('border-left-color', 'rgb(41, 128, 185)');
    }
  });

  test('"Cerrar sesión" regresa a la pantalla de login', async ({ page }) => {
    await loginAsSolicitante(page);
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page.getByRole('heading', { name: 'Bienvenido' })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test tests/ui/navigation.spec.ts --project=chromium`
Expected: `4 passed`.

- [ ] **Step 3: Commit**

```bash
git add QA/tests/ui/navigation.spec.ts
git commit -m "test: add sidebar navigation and logout spec"
```

---

### Task 4: `dashboard.spec.ts`

**Files:**
- Create: `QA/tests/ui/dashboard.spec.ts`

**Interfaces:**
- Consumes: `loginAsAbogado`.
- Context: `Dashboard` (lines 357–492). Four KPI cards with exact label/value pairs (lines 358–363): `"Expedientes Activos"/"124"`, `"Aprobados este Mes"/"47"`, `"Pendientes"/"38"`, `"Clientes Activos"/"89"`. Chart titles `"Trámites por Mes"` and `"Tipos de Trámite"` (lines 407, 427). `"Actividad Reciente"` heading with entry text `"Documento aprobado"` (lines 452, 365). `"Próximos Vencimientos"` heading with badge `"3 urgentes"` (lines 470–471). `"Nuevo Expediente"` button (line 382) has no `onClick` handler at all — genuine no-op.

- [ ] **Step 1: Write `QA/tests/ui/dashboard.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAbogado } from '../helpers/auth';

test.describe('Dashboard (Abogado)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAbogado(page);
  });

  test('muestra las 4 tarjetas KPI con sus valores', async ({ page }) => {
    await expect(page.getByText('Expedientes Activos')).toBeVisible();
    await expect(page.getByText('124', { exact: true })).toBeVisible();
    await expect(page.getByText('Aprobados este Mes')).toBeVisible();
    await expect(page.getByText('47', { exact: true })).toBeVisible();
    await expect(page.getByText('Pendientes', { exact: true })).toBeVisible();
    await expect(page.getByText('38', { exact: true })).toBeVisible();
    await expect(page.getByText('Clientes Activos')).toBeVisible();
    await expect(page.getByText('89', { exact: true })).toBeVisible();
  });

  test('renderiza los títulos de ambos gráficos', async ({ page }) => {
    await expect(page.getByText('Trámites por Mes')).toBeVisible();
    await expect(page.getByText('Tipos de Trámite')).toBeVisible();
  });

  test('muestra actividad reciente y próximos vencimientos', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Actividad Reciente' })).toBeVisible();
    await expect(page.getByText('Documento aprobado')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Próximos Vencimientos' })).toBeVisible();
    await expect(page.getByText('3 urgentes')).toBeVisible();
  });

  test('no-op: "Nuevo Expediente" no navega ni cambia el estado', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo Expediente' }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test tests/ui/dashboard.spec.ts --project=chromium`
Expected: `4 passed`.

- [ ] **Step 3: Commit**

```bash
git add QA/tests/ui/dashboard.spec.ts
git commit -m "test: add abogado dashboard spec"
```

---

### Task 5: `expedientes.spec.ts`

**Files:**
- Create: `QA/tests/ui/expedientes.spec.ts`

**Interfaces:**
- Consumes: `loginAsAbogado`.
- Context: `ExpedientesView` (lines 603–694), backed by hardcoded `EXPEDIENTES` (8 records, lines 34–43). Search input placeholder `"Buscar por nombre o número..."` (line 626) filters client-side by `cliente`/`numero` (lines 606–609). Status pills labelled `"Todos"` plus each `estadoConfig` label (line 631–637): `Activo, Pendiente, En Revisión, Docs. Faltantes, Aprobado, Rechazado`. Counter text `"{n} expedientes encontrados"` (line 616). `"Exportar"` (line 619) and `"Nuevo expediente"` (line 620) buttons have no `onClick` — no-op. Pagination buttons `1`/`2`/`3` (line 688) have **no `onClick` at all** — no-op. Clicking a row (`onClick={() => onSelect(e)}`, line 656) opens the modal (verified in Task 6). Two records have `estado: "aprobado"` (ids `4` and `8`).

- [ ] **Step 1: Write `QA/tests/ui/expedientes.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAbogado } from '../helpers/auth';

test.describe('Expedientes (Abogado)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAbogado(page);
    await page.getByRole('button', { name: 'Expedientes', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Expedientes', exact: true })).toBeVisible();
  });

  test('muestra los 8 expedientes iniciales', async ({ page }) => {
    await expect(page.getByText('8 expedientes encontrados')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(8);
  });

  test('la búsqueda filtra por nombre de cliente', async ({ page }) => {
    await page.getByPlaceholder('Buscar por nombre o número...').fill('González');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.getByText('1 expedientes encontrados')).toBeVisible();
    await expect(page.getByText('María González Herrera')).toBeVisible();
  });

  test('el pill de estado "Aprobado" filtra la tabla a 2 filas', async ({ page }) => {
    await page.getByRole('button', { name: 'Aprobado', exact: true }).click();
    await expect(page.locator('tbody tr')).toHaveCount(2);
    await expect(page.getByText('2 expedientes encontrados')).toBeVisible();
    await page.getByRole('button', { name: 'Todos', exact: true }).click();
    await expect(page.locator('tbody tr')).toHaveCount(8);
  });

  test('hacer clic en una fila abre el modal del expediente', async ({ page }) => {
    await page.getByText('María González Herrera').click();
    await expect(page.getByRole('heading', { name: 'María González Herrera' })).toBeVisible();
  });

  test('no-op: "Exportar" y "Nuevo expediente" no hacen nada', async ({ page }) => {
    await page.getByRole('button', { name: 'Exportar' }).click();
    await expect(page.getByText('8 expedientes encontrados')).toBeVisible();
    await page.getByRole('button', { name: 'Nuevo expediente' }).click();
    await expect(page.getByText('8 expedientes encontrados')).toBeVisible();
  });

  test('no-op: los botones de paginación no tienen handler', async ({ page }) => {
    await page.getByRole('button', { name: '2', exact: true }).click();
    await expect(page.getByText('Mostrando 8 de 8 expedientes')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(8);
  });
});
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test tests/ui/expedientes.spec.ts --project=chromium`
Expected: `6 passed`.

- [ ] **Step 3: Commit**

```bash
git add QA/tests/ui/expedientes.spec.ts
git commit -m "test: add expedientes list/search/filter spec"
```

---

### Task 6: `expediente-modal.spec.ts`

**Files:**
- Create: `QA/tests/ui/expediente-modal.spec.ts`

**Interfaces:**
- Consumes: `loginAsAbogado`.
- Context: `ExpedienteModal` (lines 494–601), opened from the Expedientes table. Tabs: `"Información"`, `"Documentos"`, `"Notas"` (lines 512–518). `"Subir documento"` button (line 565, Documentos tab) has no `onClick` — no-op, and there is **no `<input type="file">` anywhere in the modal**, confirming uploads are entirely decorative. Notas tab has an uncontrolled `<textarea placeholder="Agregar una nota...">` (line 585) plus an icon-only send `<button>` with no accessible name and no `onClick` (line 586) — locate it via the textarea's following sibling. `"Descargar expediente"` (line 592) really calls `descargarExpedientePdf` which triggers `pdf.save(`${exp.numero}.pdf`)` (line 153) — a real browser download. `"Actualizar estado"` (line 595) has no `onClick` — no-op. `"Cerrar"` (line 594) really closes the modal via `onClose`; the exact string `"Cerrar"` must use `{ exact: true }` because `"Cerrar sesión"` is simultaneously present in the sidebar. The modal backdrop (`className="fixed inset-0 z-50 ..."`, line 497) closes on click via `onClose`, while a click inside the white card (`onClick={e => e.stopPropagation()}`, line 498) does not — and there is no `Escape`-key handler anywhere, a real accessibility gap worth documenting.

- [ ] **Step 1: Write `QA/tests/ui/expediente-modal.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAbogado } from '../helpers/auth';

test.describe('Modal de expediente (Abogado)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAbogado(page);
    await page.getByRole('button', { name: 'Expedientes', exact: true }).click();
    await page.getByText('María González Herrera').click();
    await expect(page.getByRole('heading', { name: 'María González Herrera' })).toBeVisible();
  });

  test('muestra número y tipo de trámite en el header del modal', async ({ page }) => {
    await expect(page.getByText('EXP-2024-0451')).toBeVisible();
    await expect(page.getByText('Residencia Permanente')).toBeVisible();
  });

  test('los tabs cambian el contenido visible', async ({ page }) => {
    await expect(page.getByText('Cédula / Pasaporte')).toBeVisible();

    await page.getByRole('button', { name: 'Documentos', exact: true }).click();
    await expect(page.getByText('Antecedentes penales')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Subir documento' })).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(0);

    await page.getByRole('button', { name: 'Notas', exact: true }).click();
    await expect(page.getByText('Sistema SNM')).toBeVisible();
  });

  test('no-op: subir documento no agrega nada a la lista', async ({ page }) => {
    await page.getByRole('button', { name: 'Documentos', exact: true }).click();
    await page.getByRole('button', { name: 'Subir documento' }).click();
    await expect(page.getByText('Antecedentes penales')).toBeVisible();
  });

  test('no-op: escribir y "enviar" una nota no la agrega al historial', async ({ page }) => {
    await page.getByRole('button', { name: 'Notas', exact: true }).click();
    const textarea = page.getByPlaceholder('Agregar una nota...');
    await textarea.fill('Nota de prueba QA');
    await textarea.locator('xpath=following-sibling::button[1]').click();
    await expect(page.getByText('Nota de prueba QA')).not.toBeVisible();
  });

  test('no-op: "Actualizar estado" no cambia el badge de estado', async ({ page }) => {
    await expect(page.getByText('Activo', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Actualizar estado' }).click();
    await expect(page.getByText('Activo', { exact: true })).toBeVisible();
  });

  test('real: "Descargar expediente" genera un PDF descargable', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar expediente' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('EXP-2024-0451.pdf');
  });

  test('real: "Cerrar" y el click en el fondo cierran el modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'María González Herrera' })).not.toBeVisible();

    await page.getByText('María González Herrera').click();
    await expect(page.getByRole('heading', { name: 'María González Herrera' })).toBeVisible();
    await page.locator('.fixed.inset-0.z-50').click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole('heading', { name: 'María González Herrera' })).not.toBeVisible();
  });

  test('hallazgo: la tecla Escape no cierra el modal (no hay handler de teclado)', async ({ page }) => {
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'María González Herrera' })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test tests/ui/expediente-modal.spec.ts --project=chromium`
Expected: `8 passed`. If the download test fails because no `downloads` behavior is configured, no extra Playwright config is needed — `waitForEvent('download')` works out of the box in Chromium headless.

- [ ] **Step 3: Commit**

```bash
git add QA/tests/ui/expediente-modal.spec.ts
git commit -m "test: add expediente modal spec (tabs, PDF download, no-ops)"
```

---

### Task 7: `clientes.spec.ts`

**Files:**
- Create: `QA/tests/ui/clientes.spec.ts`

**Interfaces:**
- Consumes: `loginAsAbogado`.
- Context: `ClientesView` (lines 696–742), 6 hardcoded clients. `"Nuevo cliente"` button (line 712) has no `onClick` — no-op. Client `Roberto Chen Wei` has `estado: "inactivo"` → badge text `"Inactivo"` (lines 728–730); all others show `"Activo"`.

- [ ] **Step 1: Write `QA/tests/ui/clientes.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAbogado } from '../helpers/auth';

test.describe('Clientes (Abogado)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAbogado(page);
    await page.getByRole('button', { name: 'Clientes', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Clientes', exact: true })).toBeVisible();
  });

  test('muestra los 6 clientes registrados', async ({ page }) => {
    await expect(page.getByText('6 clientes registrados')).toBeVisible();
    await expect(page.getByText('María González Herrera')).toBeVisible();
    await expect(page.getByText('Roberto Chen Wei')).toBeVisible();
    await expect(page.getByText('Inactivo')).toBeVisible();
  });

  test('no-op: "Nuevo cliente" no hace nada', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo cliente' }).click();
    await expect(page.getByText('6 clientes registrados')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test tests/ui/clientes.spec.ts --project=chromium`
Expected: `2 passed`.

- [ ] **Step 3: Commit**

```bash
git add QA/tests/ui/clientes.spec.ts
git commit -m "test: add clientes grid spec"
```

---

### Task 8: `configuracion.spec.ts`

**Files:**
- Create: `QA/tests/ui/configuracion.spec.ts`

**Interfaces:**
- Consumes: `loginAsAbogado`.
- Context: `ConfiguracionView` (lines 744–765). Four uncontrolled inputs with `defaultValue` (lines 750–754): `"Nombre del despacho"` = `"Soto & Asociados Abogados"`, `"Registro en el COLPA"` = `"COL-2019-04821"`, `"Teléfono de contacto"` = `"+507 6123-4567"`, `"Correo oficial"` = `"info@sotoasociados.pa"`. `"Guardar cambios"` (line 761) has no `onClick`. Because the view is conditionally mounted (`{view === "configuracion" && <ConfiguracionView/>}`, line 811), navigating away and back **remounts** it, resetting any typed value back to `defaultValue` — a clean way to prove nothing persists without a full page reload.
- **Important markup detail:** each `<label>` (line 757) has no `htmlFor`, and its `<input>` (line 758) has no `id` — they are plain sibling elements inside a `<div>`, not programmatically associated. `getByLabel(...)` will NOT find these inputs (Playwright requires `for`/`id`, label-wraps-input, or `aria-labelledby`/`aria-label`, none of which apply here). Locate each input via the CSS sibling combinator instead: `page.locator('label:text-is("Nombre del despacho") + input')`.

- [ ] **Step 1: Write `QA/tests/ui/configuracion.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAbogado } from '../helpers/auth';

test.describe('Configuración (Abogado)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAbogado(page);
    await page.getByRole('button', { name: 'Configuración', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Configuración', exact: true })).toBeVisible();
  });

  test('muestra los valores por defecto del despacho', async ({ page }) => {
    await expect(page.locator('label:text-is("Nombre del despacho") + input')).toHaveValue('Soto & Asociados Abogados');
    await expect(page.locator('label:text-is("Registro en el COLPA") + input')).toHaveValue('COL-2019-04821');
    await expect(page.locator('label:text-is("Teléfono de contacto") + input')).toHaveValue('+507 6123-4567');
    await expect(page.locator('label:text-is("Correo oficial") + input')).toHaveValue('info@sotoasociados.pa');
  });

  test('hallazgo: "Guardar cambios" no persiste ninguna edición', async ({ page }) => {
    const nombreInput = page.locator('label:text-is("Nombre del despacho") + input');
    await nombreInput.fill('Despacho de Prueba QA');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
    await page.getByRole('button', { name: 'Configuración', exact: true }).click();

    await expect(page.locator('label:text-is("Nombre del despacho") + input')).toHaveValue('Soto & Asociados Abogados');
  });
});
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test tests/ui/configuracion.spec.ts --project=chromium`
Expected: `2 passed`.

- [ ] **Step 3: Commit**

```bash
git add QA/tests/ui/configuracion.spec.ts
git commit -m "test: add configuracion form spec"
```

---

### Task 9: `solicitante-inicio.spec.ts`

**Files:**
- Create: `QA/tests/ui/solicitante-inicio.spec.ts`

**Interfaces:**
- Consumes: `loginAsSolicitante`.
- Context: `SolicitanteInicio` (lines 1099–1202), default view. Active trámite is `MIS_TRAMITES[0]` (lines 823–833): tipo `"Residencia Permanente"`, `numero` `"EXP-2024-0451"`, `abogado` `"Lcda. Laura Soto"`, `progreso: 60` → visible text `"60%"` (line 1127). Steps `"Recibido", "Documentación", "En Revisión", "Decisión", "Resolución"` (line 1102). The 4 quick-action buttons (lines 1156–1180) **do** have real `onClick={() => setView(a.view)}` handlers — genuinely functional navigation, not decorative: `"Mis Trámites"` → mistramites, `"Nuevo Trámite"` → solicitar, `"Oficinas SNM"` → oficinas, `"Centro de Ayuda"` → ayuda. `"Subir ahora"` (line 1197) has no `onClick` — no-op, and there is no `<input type="file">` anywhere on this view.
- **Known collision:** the sidebar `SolicitanteNav` (always rendered alongside the main content, confirmed in Task 3's review) has nav buttons labeled exactly `"Mis Trámites"` and `"Nuevo Trámite"` too (lines 1053-1054) — identical accessible names to two of the four quick-action buttons here. Scope the quick-action clicks to the main content pane to avoid a strict-mode violation: both layouts render their content in a `<div className="flex-1 overflow-y-auto p-5">` (verified at lines 807 and 1735), so use `page.locator('div.flex-1.overflow-y-auto')` as the scoping locator for these two specific clicks (the other two quick-action buttons, "Oficinas SNM" and "Centro de Ayuda", have no colliding sidebar label — "Oficinas" and "Ayuda" are shorter substrings contained the other way around, not vice versa — so they don't need scoping).

- [ ] **Step 1: Write `QA/tests/ui/solicitante-inicio.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsSolicitante } from '../helpers/auth';

test.describe('Inicio (Solicitante)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSolicitante(page);
  });

  test('muestra el trámite activo con su progreso', async ({ page }) => {
    await expect(page.getByText('Residencia Permanente')).toBeVisible();
    await expect(page.getByText('EXP-2024-0451')).toBeVisible();
    await expect(page.getByText('Lcda. Laura Soto')).toBeVisible();
    await expect(page.getByText('60%')).toBeVisible();
  });

  test('muestra los 5 pasos del proceso', async ({ page }) => {
    for (const step of ['Recibido', 'Documentación', 'En Revisión', 'Decisión', 'Resolución']) {
      await expect(page.getByText(step, { exact: true })).toBeVisible();
    }
  });

  test('real: los 4 accesos rápidos navegan a su vista correspondiente', async ({ page }) => {
    const mainContent = page.locator('div.flex-1.overflow-y-auto');
    await mainContent.getByRole('button', { name: 'Mis Trámites', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Mis Trámites', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Inicio', exact: true }).click();
    await mainContent.getByRole('button', { name: 'Nuevo Trámite', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Solicitar Nuevo Trámite' })).toBeVisible();

    await page.getByRole('button', { name: 'Inicio', exact: true }).click();
    await page.getByRole('button', { name: 'Oficinas SNM' }).click();
    await expect(page.getByRole('heading', { name: 'Oficinas del SNM' })).toBeVisible();

    await page.getByRole('button', { name: 'Inicio', exact: true }).click();
    await page.getByRole('button', { name: 'Centro de Ayuda' }).click();
    await expect(page.getByRole('heading', { name: 'Centro de Ayuda' })).toBeVisible();
  });

  test('no-op: "Subir ahora" no hace nada', async ({ page }) => {
    await page.getByRole('button', { name: 'Subir ahora' }).click();
    await expect(page.getByRole('heading', { name: 'Bienvenida, María' })).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
  });
});
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test tests/ui/solicitante-inicio.spec.ts --project=chromium`
Expected: `4 passed`.

- [ ] **Step 3: Commit**

```bash
git add QA/tests/ui/solicitante-inicio.spec.ts
git commit -m "test: add solicitante inicio spec"
```

---

### Task 10: `mis-tramites.spec.ts`

**Files:**
- Create: `QA/tests/ui/mis-tramites.spec.ts`

**Interfaces:**
- Consumes: `loginAsSolicitante`.
- Context: `SolicitanteMisTramites` (lines 1204–1300), 2 hardcoded trámites: `"Residencia Permanente"` (EXP-2024-0451) and `"Visa de Inversionista"` (EXP-2024-0288). Clicking a card header toggles `selected` (real accordion, lines 1217–1220). Expanded content shows `"Abogado asignado"` → `"Lcda. Laura Soto"`, `"Documentos"` → `"3 de 5"`, and 3 historial entries including `"Expediente en revisión por el SNM"` (line 829). `"Subir documentos"` and `"Contactar abogado"` buttons (lines 1289–1290) have no `onClick` — no-op.

- [ ] **Step 1: Write `QA/tests/ui/mis-tramites.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsSolicitante } from '../helpers/auth';

test.describe('Mis Trámites (Solicitante)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSolicitante(page);
    await page.getByRole('button', { name: 'Mis Trámites' }).click();
    await expect(page.getByRole('heading', { name: 'Mis Trámites', exact: true })).toBeVisible();
  });

  test('muestra los 2 trámites del solicitante', async ({ page }) => {
    await expect(page.getByText('Residencia Permanente')).toBeVisible();
    await expect(page.getByText('Visa de Inversionista')).toBeVisible();
  });

  test('real: expandir un trámite muestra abogado, documentos e historial', async ({ page }) => {
    await page.getByText('Residencia Permanente').click();
    await expect(page.getByText('Abogado asignado')).toBeVisible();
    await expect(page.getByText('Lcda. Laura Soto')).toBeVisible();
    await expect(page.getByText('3 de 5')).toBeVisible();
    await expect(page.getByText('Expediente en revisión por el SNM')).toBeVisible();
  });

  test('real: volver a hacer clic colapsa el trámite', async ({ page }) => {
    await page.getByText('Residencia Permanente').click();
    await expect(page.getByText('Abogado asignado')).toBeVisible();
    await page.getByText('Residencia Permanente').click();
    await expect(page.getByText('Abogado asignado')).not.toBeVisible();
  });

  test('no-op: "Subir documentos" y "Contactar abogado" no hacen nada', async ({ page }) => {
    await page.getByText('Residencia Permanente').click();
    await page.getByRole('button', { name: 'Subir documentos' }).click();
    await page.getByRole('button', { name: 'Contactar abogado' }).click();
    await expect(page.getByText('Abogado asignado')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test tests/ui/mis-tramites.spec.ts --project=chromium`
Expected: `4 passed`.

- [ ] **Step 3: Commit**

```bash
git add QA/tests/ui/mis-tramites.spec.ts
git commit -m "test: add mis tramites accordion spec"
```

---

### Task 11: `solicitar-tramite.spec.ts` (most critical — documents the data-loss bug)

**Files:**
- Create: `QA/tests/ui/solicitar-tramite.spec.ts`

**Interfaces:**
- Consumes: `loginAsSolicitante`.
- Context: `SolicitanteSolicitar` (lines 1302–1507), a 3-step wizard (`step` state, starts at 1). Step 1: 6 trámite-type cards from `TRAMITES_CATALOGO` (lines 909–1045); selecting one enables `"Continuar"` (`disabled={!selected}`, line 1391). Step 2: 8 uncontrolled `<input>` fields with **no `value`/`defaultValue` at all** (lines 1409–1424) — typing into them is never captured anywhere; `"Revisar solicitud"` (line 1431) advances to step 3 with **zero validation** regardless of field contents. Step 3 renders a **hardcoded** summary (lines 1480–1493: always `"James William Scott"`, `"AB1234567"`, etc., except the `"Tipo de trámite"` field which does reflect the real `selected` value) — this is the confirmed bug: user input from step 2 never appears in step 3. `"Enviar solicitud"` (line 1501) **is wired** (`onClick={() => setStep(1)}`) but only silently resets the wizard to step 1 with no success confirmation anywhere — a misleading-success gap, not a pure no-op. Going step2 → step1 → step2 preserves the selected trámite type (parent state) but step3 → step2 remounts the form fields empty (conditionally-rendered JSX, no `key` reuse trick), proving there is no persistence across the back navigation either.
- **Known collision:** same pattern as Tasks 9-10 — the sidebar `SolicitanteNav` has a "Nuevo Trámite" button (identical accessible name to the Inicio quick-action card), and this spec logs in fresh each time (landing on Inicio by default), so the `beforeEach` must click the sidebar one. Scope via `page.getByRole('navigation')` (the only `<nav>` rendered under the solicitante role), same fix as Task 10.

- [ ] **Step 1: Write `QA/tests/ui/solicitar-tramite.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsSolicitante } from '../helpers/auth';

test.describe('Solicitar Nuevo Trámite (Solicitante)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSolicitante(page);
    await page.getByRole('navigation').getByRole('button', { name: 'Nuevo Trámite', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Solicitar Nuevo Trámite' })).toBeVisible();
  });

  test('paso 1: "Continuar" está deshabilitado hasta seleccionar un tipo', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    await page.getByText('Permiso de Trabajo').click();
    await expect(page.getByText('Documentos requeridos:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  });

  test('paso 2: muestra el trámite elegido y el resumen de requisitos', async ({ page }) => {
    await page.getByText('Permiso de Trabajo').click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Trámite: Permiso de Trabajo')).toBeVisible();
    await expect(page.getByText('Permiso de Trabajo · 9 documentos')).toBeVisible();
  });

  test('BUG: el resumen del paso 3 no refleja los datos ingresados por el usuario', async ({ page }) => {
    await page.getByText('Permiso de Trabajo').click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page.getByPlaceholder('Ej. James William Scott').fill('Test QA Nombre');
    await page.getByPlaceholder('Ej. AB1234567').fill('QA0000000');
    await page.getByPlaceholder('correo@ejemplo.com').fill('qa@example.com');

    await page.getByRole('button', { name: 'Revisar solicitud' }).click();

    // Defecto confirmado: el formulario del paso 2 es completamente no-controlado,
    // así que el resumen sigue mostrando los valores hardcodeados en vez de los reales.
    await expect(page.getByText('Test QA Nombre')).toHaveCount(0);
    await expect(page.getByText('James William Scott')).toBeVisible();
    await expect(page.getByText('AB1234567')).toBeVisible();
  });

  test('el campo "Tipo de trámite" del resumen sí refleja la selección real', async ({ page }) => {
    await page.getByText('Naturalización').click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Revisar solicitud' }).click();
    await expect(page.getByText('Naturalización').first()).toBeVisible();
  });

  test('hallazgo: "Enviar solicitud" resetea el wizard sin ninguna confirmación de éxito', async ({ page }) => {
    await page.getByText('Naturalización').click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Revisar solicitud' }).click();
    await page.getByRole('button', { name: 'Enviar solicitud' }).click();

    await expect(page.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    await expect(page.getByText(/enviada con éxito/i)).toHaveCount(0);
  });

  test('la selección de tipo persiste al volver del paso 2 al paso 1', async ({ page }) => {
    await page.getByText('Naturalización').click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Atrás' }).click();
    await expect(page.getByText('Documentos requeridos:')).toBeVisible();
  });

  test('hallazgo: los campos del paso 2 no se conservan al ir a paso 3 y volver', async ({ page }) => {
    await page.getByText('Naturalización').click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByPlaceholder('Ej. James William Scott').fill('Test QA Nombre');
    await page.getByRole('button', { name: 'Revisar solicitud' }).click();
    await page.getByRole('button', { name: 'Atrás' }).click();
    await expect(page.getByPlaceholder('Ej. James William Scott')).toHaveValue('');
  });
});
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test tests/ui/solicitar-tramite.spec.ts --project=chromium`
Expected: `7 passed`. This is the highest-risk spec to need selector tweaking on first run (dynamic `selected` text collisions) — if `getByText('Naturalización')` resolves to more than one element on step 3 (once in the summary row, once in the leftover card grid if not fully unmounted), keep the `.first()` pattern already used in one assertion and extend it to any other flaky match encountered.

- [ ] **Step 3: Commit**

```bash
git add QA/tests/ui/solicitar-tramite.spec.ts
git commit -m "test: add nuevo tramite wizard spec, document data-loss bug"
```

---

### Task 12: `oficinas.spec.ts`

**Files:**
- Create: `QA/tests/ui/oficinas.spec.ts`

**Interfaces:**
- Consumes: `loginAsSolicitante`.
- Context: `SolicitanteOficinas` (lines 1509–1604). `OFICINAS` (lines 846–907) has 6 entries: 1 `Central`, 2 `Regional` (Colón, Chiriquí), 1 `Aeropuerto` (Tocumen), 2 `Frontera` (Paso Canoas, Guabito–Almirante). Filter pills: `"Todas", "Central", "Regional", "Aeropuerto", "Frontera"` (line 1511). `"Ver en mapa"` and `"Llamar"` buttons (lines 1584–1589) have no `onClick` — no-op.

- [ ] **Step 1: Write `QA/tests/ui/oficinas.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsSolicitante } from '../helpers/auth';

test.describe('Oficinas (Solicitante)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSolicitante(page);
    await page.getByRole('button', { name: 'Oficinas', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Oficinas del SNM' })).toBeVisible();
  });

  test('muestra las 6 oficinas por defecto', async ({ page }) => {
    await expect(page.getByText('Oficina Central')).toBeVisible();
    await expect(page.getByText('Aeropuerto Internacional de Tocumen')).toBeVisible();
  });

  test('los filtros por tipo reducen la lista de oficinas', async ({ page }) => {
    await page.getByRole('button', { name: 'Aeropuerto', exact: true }).click();
    await expect(page.getByText('Aeropuerto Internacional de Tocumen')).toBeVisible();
    await expect(page.getByText('Oficina Central')).not.toBeVisible();

    await page.getByRole('button', { name: 'Frontera', exact: true }).click();
    await expect(page.getByText('Frontera Paso Canoas')).toBeVisible();
    await expect(page.getByText('Frontera Guabito')).toBeVisible();

    await page.getByRole('button', { name: 'Todas', exact: true }).click();
    await expect(page.getByText('Oficina Central')).toBeVisible();
    await expect(page.getByText('Aeropuerto Internacional de Tocumen')).toBeVisible();
  });

  test('no-op: "Ver en mapa" y "Llamar" no hacen nada', async ({ page }) => {
    await page.getByRole('button', { name: 'Ver en mapa' }).first().click();
    await page.getByRole('button', { name: 'Llamar' }).first().click();
    await expect(page.getByRole('heading', { name: 'Oficinas del SNM' })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test tests/ui/oficinas.spec.ts --project=chromium`
Expected: `3 passed`.

- [ ] **Step 3: Commit**

```bash
git add QA/tests/ui/oficinas.spec.ts
git commit -m "test: add oficinas filter spec"
```

---

### Task 13: `ayuda.spec.ts`

**Files:**
- Create: `QA/tests/ui/ayuda.spec.ts`

**Interfaces:**
- Consumes: `loginAsSolicitante`.
- Context: `SolicitanteAyuda` (lines 1606–1671). Contact cards: `"Llámanos"/"+507 507-1000"`, `"Escríbenos"/"soporte@siddim.pa"`, `"Chat en vivo"/"Lun–Vie 8am–5pm"` (lines 1625–1627). `FaqItem` (lines 1673–1690) is a real, working accordion (local `open` state) — first FAQ question is `"¿Cuánto tiempo toma el proceso de residencia permanente?"` with answer containing `"entre 3 y 6 meses"` (line 1608). `"Recursos útiles"` links (lines 1656–1666) are plain `<button>`s with no `onClick` — no-op, no navigation possible.

- [ ] **Step 1: Write `QA/tests/ui/ayuda.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsSolicitante } from '../helpers/auth';

test.describe('Centro de Ayuda (Solicitante)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSolicitante(page);
    await page.getByRole('button', { name: 'Ayuda', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Centro de Ayuda' })).toBeVisible();
  });

  test('muestra las 3 tarjetas de contacto', async ({ page }) => {
    await expect(page.getByText('+507 507-1000')).toBeVisible();
    await expect(page.getByText('soporte@siddim.pa')).toBeVisible();
    await expect(page.getByText('Lun–Vie 8am–5pm')).toBeVisible();
  });

  test('real: el acordeón de FAQ expande y colapsa', async ({ page }) => {
    const question = page.getByRole('button', { name: '¿Cuánto tiempo toma el proceso de residencia permanente?' });
    await expect(page.getByText('entre 3 y 6 meses')).not.toBeVisible();
    await question.click();
    await expect(page.getByText(/entre 3 y 6 meses/)).toBeVisible();
    await question.click();
    await expect(page.getByText(/entre 3 y 6 meses/)).not.toBeVisible();
  });

  test('no-op: los enlaces de "Recursos útiles" no navegan', async ({ page }) => {
    await page.getByRole('button', { name: 'Portal oficial del SNM' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Centro de Ayuda' })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test tests/ui/ayuda.spec.ts --project=chromium`
Expected: `3 passed`.

- [ ] **Step 3: Commit**

```bash
git add QA/tests/ui/ayuda.spec.ts
git commit -m "test: add centro de ayuda spec"
```

---

### Task 14: API specs — `health.spec.ts` + `not-found.spec.ts`

**Files:**
- Create: `QA/tests/api/health.spec.ts`
- Create: `QA/tests/api/not-found.spec.ts`

**Interfaces:**
- Uses Playwright's built-in `request` fixture directly against `http://localhost:3000` (absolute URLs, independent of the UI `baseURL`).
- Context: `backend/src/app.js` (read in full) has exactly 3 behaviors: `GET /api/health` → `200 { status: "ok", service: "sigdim-api" }` (lines 10–12); a catch-all 404 handler → `{ message: "Ruta no encontrada" }` (line 14); and a 5-parameter error handler for uncaught exceptions (line 16–19, not reachable by any current route, so not tested). `cors({ origin: env.frontendUrl })` (line 7) sets `Access-Control-Allow-Origin: http://localhost:5173` unconditionally on every response since `origin` is passed as a static string.

- [ ] **Step 1: Write `QA/tests/api/health.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3000';

test.describe('API /api/health', () => {
  test('responde 200 con el shape esperado', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/health`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', service: 'sigdim-api' });
  });

  test('incluye el header CORS para el frontend', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/health`);
    expect(response.headers()['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
```

- [ ] **Step 2: Write `QA/tests/api/not-found.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3000';

test.describe('API — ruta inexistente', () => {
  test('responde 404 con mensaje de error en español', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/no-existe`);
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ message: 'Ruta no encontrada' });
  });
});
```

- [ ] **Step 3: Run both specs**

Run: `npx playwright test tests/api --project=chromium`
Expected: `3 passed`.

- [ ] **Step 4: Commit**

```bash
git add QA/tests/api/health.spec.ts QA/tests/api/not-found.spec.ts
git commit -m "test: add backend API specs (health, 404)"
```

---

### Task 15: Full suite run + `QA/REPORTE_HALLAZGOS.md`

**Files:**
- Create: `QA/REPORTE_HALLAZGOS.md`

**Interfaces:**
- Consumes: the pass/fail results and test titles/counts from every spec file created in Tasks 2–14 (this task must be done last, and must reflect the *actual* `npx playwright test` output, not assumptions).

- [ ] **Step 1: Run the entire suite**

Run: `npx playwright test --project=chromium`
Expected: `57 passed` (7 auth + 4 navigation + 4 dashboard + 6 expedientes + 8 expediente-modal + 2 clientes + 2 configuracion + 4 solicitante-inicio + 4 mis-tramites + 7 solicitar-tramite + 3 oficinas + 3 ayuda + 3 api). If the actual count differs, treat it as a signal that a selector matched zero or multiple elements in some test — use `npx playwright show-report` and `--debug` on the failing file to fix it, then re-run this step before continuing.

- [ ] **Step 2: Write `QA/REPORTE_HALLAZGOS.md`**

```markdown
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
6. **"Enviar solicitud" da una falsa sensación de éxito.** Al hacer clic simplemente resetea el wizard al paso 1 sin mostrar ningún mensaje de confirmación ni error — el usuario no tiene forma de saber si "funcionó".
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
```

- [ ] **Step 3: Commit**

```bash
git add QA/REPORTE_HALLAZGOS.md
git commit -m "docs: add QA findings report"
```

---

### Task 16: `QA/README.md` and final full-suite verification

**Files:**
- Create: `QA/README.md`

**Interfaces:**
- None (terminal task).

- [ ] **Step 1: Write `QA/README.md`**

```markdown
# QA — Suite de pruebas Playwright (SIGDIM)

## Requisitos previos

- Node.js 18+
- El backend necesita `backend/.env` con `DATABASE_URL`, `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` definidos (no necesita una base de datos alcanzable: ninguna ruta actual toca Prisma).

## Instalación

```bash
cd QA
npm install
npx playwright install chromium
```

## Ejecutar la suite

```bash
npm test              # corre todos los specs (levanta frontend y backend automáticamente)
npm run test:ui       # modo interactivo (UI mode) de Playwright
npm run report        # abre el último reporte HTML generado
```

Los servidores de frontend (`http://localhost:5173`) y backend (`http://localhost:3000`) se levantan automáticamente vía `webServer` en `playwright.config.ts`, reutilizando instancias ya corriendo si existen.

## Estructura

```
QA/
  tests/
    helpers/auth.ts     # login como abogado o solicitante
    ui/                 # un spec por pantalla del frontend
    api/                # specs contra el backend real (health, 404)
  REPORTE_HALLAZGOS.md  # estado de cada pantalla y riesgos para producción
```

## Convención de los tests

- Los tests marcados `no-op:` confirman explícitamente que un botón decorativo no hace nada — son parte deliberada de la cobertura, no fallos.
- Los tests marcados `BUG:` o `hallazgo:` documentan defectos o gaps reales del sistema. Están escritos para pasar hoy (afirman el comportamiento actual); si alguien corrige el defecto correspondiente, ese test empezará a fallar como señal de que el reporte de hallazgos debe actualizarse.
```

- [ ] **Step 2: Run the complete suite one final time**

Run: `npx playwright test --project=chromium`
Expected: 100% pass, matching the count confirmed in Task 15 Step 1.

- [ ] **Step 3: Commit**

```bash
git add QA/README.md
git commit -m "docs: add QA suite README"
```
