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
