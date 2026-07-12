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
