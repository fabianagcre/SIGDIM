import { test, expect } from '@playwright/test';
import { loginAsSolicitante } from '../helpers/auth';

test.describe('Inicio (Solicitante)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSolicitante(page);
  });

  test('muestra el trámite activo con su progreso', async ({ page }) => {
    await expect(page.getByText('Residencia Permanente')).toBeVisible();
    await expect(page.getByText('EXP-2024-0451').first()).toBeVisible();
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
