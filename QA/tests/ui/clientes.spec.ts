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
