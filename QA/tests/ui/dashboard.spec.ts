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
