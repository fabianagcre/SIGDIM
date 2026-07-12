import { test, expect } from '@playwright/test';
import { loginAsSolicitante } from '../helpers/auth';

test.describe('Representación (Solicitante) — Asignar/Revocar Abogado', () => {
  test('el tile de Inicio muestra "Asignar Abogado" cuando no hay representación activa', async ({ page }) => {
    await loginAsSolicitante(page);
    await expect(page.getByRole('button', { name: 'Asignar Abogado' })).toBeVisible();
  });

  test('buscar una licencia inexistente muestra el mensaje de no encontrado', async ({ page }) => {
    await loginAsSolicitante(page);
    await page.getByRole('button', { name: 'Asignar Abogado' }).click();
    await page.getByPlaceholder('Ej. LIC-4521').fill('NO-EXISTE');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.getByText('No se encontró ningún abogado')).toBeVisible();
  });

  test('el botón de asignar permanece deshabilitado hasta marcar al menos un permiso', async ({ page }) => {
    await loginAsSolicitante(page);
    await page.getByRole('button', { name: 'Asignar Abogado' }).click();
    await page.getByPlaceholder('Ej. LIC-4521').fill('LIC-4521');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.getByText('Lcda. Ana Ábrego')).toBeVisible();

    const asignarBtn = page.getByRole('button', { name: /Asignar como mi representante/ });
    await expect(asignarBtn).toBeDisabled();
    await page.getByText('Ver mi expediente').click();
    await expect(asignarBtn).toBeEnabled();
  });

  test('flujo completo: asignar abogado con permisos, ver "Mi Abogado" y revocar', async ({ page }) => {
    await loginAsSolicitante(page);
    await page.getByRole('button', { name: 'Asignar Abogado' }).click();

    await page.getByPlaceholder('Ej. LIC-4521').fill('LIC-4521');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await page.getByText('Ver mi expediente').click();
    await page.getByText('Subir documentos').click();
    await page.getByRole('button', { name: /Asignar como mi representante/ }).click();

    await expect(page.getByRole('heading', { name: 'Mi Abogado' })).toBeVisible();
    await expect(page.getByText('Lcda. Ana Ábrego')).toBeVisible();
    await expect(page.getByText('Activa')).toBeVisible();

    await page.getByRole('button', { name: 'Revocar representación' }).click();
    await page.getByRole('button', { name: 'Sí, revocar' }).click();
    await expect(page.getByText('Todavía no has asignado un abogado representante.')).toBeVisible();

    await page.getByRole('navigation').getByRole('button', { name: 'Inicio' }).click();
    await expect(page.getByRole('button', { name: 'Asignar Abogado' })).toBeVisible();
  });
});
