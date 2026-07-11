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
    // The Expedientes table stays mounted behind the modal backdrop, and it repeats
    // both e.numero and e.tipo as plain text (App.tsx lines 657 & 669), so an
    // unscoped getByText() collides with the modal's own header text (lines 503 & 507).
    // Scope to the modal header block itself (the container div wrapping the
    // heading, at App.tsx line 501) to disambiguate.
    const modalHeader = page.getByRole('heading', { name: 'María González Herrera' }).locator('xpath=..');
    await expect(modalHeader.getByText('EXP-2024-0451')).toBeVisible();
    await expect(modalHeader.getByText('Residencia Permanente')).toBeVisible();
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
    // Unscoped, getByText('Activo', { exact: true }) resolves to 4 elements: the
    // "Activo" filter chip and 3 StatusBadge instances in the table rendered
    // behind the modal (App.tsx lines 631-637 & 673), plus the modal's own
    // StatusBadge (line 504). Scope to the modal header block (line 501) to
    // isolate the one badge this test is actually about.
    const modalHeader = page.getByRole('heading', { name: 'María González Herrera' }).locator('xpath=..');
    await expect(modalHeader.getByText('Activo', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Actualizar estado' }).click();
    await expect(modalHeader.getByText('Activo', { exact: true })).toBeVisible();
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
