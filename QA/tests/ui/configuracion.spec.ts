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
