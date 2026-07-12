import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { loginAsAbogado } from '../helpers/auth';

test.describe('Modal de expediente (Abogado)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAbogado(page);
    // El login del abogado dispara una autenticación real en segundo plano
    // contra el backend (ver App.tsx, useEffect de `abogadoToken`) para que
    // el modal pueda subir documentos / actualizar estado de verdad. Dale
    // tiempo a resolver antes de interactuar con el modal.
    await page.waitForTimeout(1000);
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
    await expect(page.getByText('Pasaporte', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Documentos', exact: true }).click();
    await expect(page.getByText('Subir documento', { exact: true })).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(1);

    await page.getByRole('button', { name: 'Notas', exact: true }).click();
    await expect(page.getByText('Sistema SNM')).toBeVisible();
  });

  test('real: subir documento lo persiste en el backend y aparece en la lista', async ({ page }) => {
    const tmpPath = path.join(os.tmpdir(), `qa-upload-${Date.now()}.txt`);
    fs.writeFileSync(tmpPath, 'contenido de prueba QA');

    await page.getByRole('button', { name: 'Documentos', exact: true }).click();
    await page.locator('input[type="file"]').setInputFiles(tmpPath);
    await expect(page.getByText(path.basename(tmpPath))).toBeVisible({ timeout: 8000 });

    fs.unlinkSync(tmpPath);
  });

  test('no-op: escribir y "enviar" una nota no la agrega al historial', async ({ page }) => {
    await page.getByRole('button', { name: 'Notas', exact: true }).click();
    const textarea = page.getByPlaceholder('Agregar una nota...');
    await textarea.fill('Nota de prueba QA');
    await textarea.locator('xpath=following-sibling::button[1]').click();
    await expect(page.getByText('Nota de prueba QA')).not.toBeVisible();
  });

  test('real: "Actualizar estado" persiste el cambio en el backend y actualiza el badge', async ({ page }) => {
    // Escoge un estado destino fijo (en vez de comparar contra el estado inicial)
    // para que el test sea repetible sin re-sembrar la base entre corridas.
    const modalHeader = page.getByRole('heading', { name: 'María González Herrera' }).locator('xpath=..');
    await page.getByRole('button', { name: 'Actualizar estado' }).click();
    await page.locator('select').selectOption('rechazado');
    await page.getByPlaceholder('Comentario (opcional)').fill('QA: prueba de actualización de estado');
    await page.getByRole('button', { name: 'Guardar estado' }).click();
    await expect(modalHeader.getByText('Rechazado', { exact: true })).toBeVisible({ timeout: 8000 });

    // Verifica directo contra la API que quedó guardado en Postgres, no solo en
    // el estado de React (la lista de Expedientes en pantalla sigue siendo mock).
    const login = await page.request.post('http://localhost:3000/api/auth/login', {
      data: { email: 'abogado@sigdim.gov.pa', password: 'Abogado123!' },
    });
    const { accessToken } = await login.json();
    const detalle = await page.request.get('http://localhost:3000/api/expedientes/EXP-2024-0451', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect((await detalle.json()).estado).toBe('RECHAZADO');
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
