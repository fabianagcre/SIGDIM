import { test, expect } from '@playwright/test';
import { loginAsSolicitante } from '../helpers/auth';

test.describe('Mis Trámites (Solicitante)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSolicitante(page);
    await page.getByRole('navigation').getByRole('button', { name: 'Mis Trámites' }).click();
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
