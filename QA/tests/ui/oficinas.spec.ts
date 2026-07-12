import { test, expect } from '@playwright/test';
import { loginAsSolicitante } from '../helpers/auth';

test.describe('Oficinas (Solicitante)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSolicitante(page);
    await page.getByRole('navigation').getByRole('button', { name: 'Oficinas', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Oficinas del SNM' })).toBeVisible();
  });

  test('muestra 6 oficinas por defecto', async ({ page }) => {
    const offices = [
      'Oficina Central – Ciudad de Panamá',
      'Oficina Regional – Colón',
      'Oficina Regional – Chiriquí',
      'Aeropuerto Internacional de Tocumen',
      'Frontera Paso Canoas',
      'Frontera Guabito – Almirante',
    ];
    for (const office of offices) {
      await expect(page.getByText(office)).toBeVisible();
    }
  });

  test('real: filtrar por tipo muestra solo oficinas de ese tipo', async ({ page }) => {
    // Filtro Regional
    await page.getByRole('button', { name: 'Regional', exact: true }).click();
    await expect(page.getByText('Oficina Regional – Colón')).toBeVisible();
    await expect(page.getByText('Oficina Regional – Chiriquí')).toBeVisible();
    await expect(page.getByText('Oficina Central – Ciudad de Panamá')).not.toBeVisible();
    await expect(page.getByText('Aeropuerto Internacional de Tocumen')).not.toBeVisible();

    // Filtro Aeropuerto
    await page.getByRole('button', { name: 'Aeropuerto', exact: true }).click();
    await expect(page.getByText('Aeropuerto Internacional de Tocumen')).toBeVisible();
    await expect(page.getByText('Oficina Central – Ciudad de Panamá')).not.toBeVisible();
    await expect(page.getByText('Oficina Regional – Colón')).not.toBeVisible();

    // Filtro Frontera
    await page.getByRole('button', { name: 'Frontera', exact: true }).click();
    await expect(page.getByText('Frontera Paso Canoas')).toBeVisible();
    await expect(page.getByText('Frontera Guabito – Almirante')).toBeVisible();
    await expect(page.getByText('Oficina Central – Ciudad de Panamá')).not.toBeVisible();
    await expect(page.getByText('Aeropuerto Internacional de Tocumen')).not.toBeVisible();

    // Reinicio al filtro "Todas"
    await page.getByRole('button', { name: 'Todas', exact: true }).click();
    await expect(page.getByText('Oficina Central – Ciudad de Panamá')).toBeVisible();
    await expect(page.getByText('Oficina Regional – Colón')).toBeVisible();
    await expect(page.getByText('Oficina Regional – Chiriquí')).toBeVisible();
    await expect(page.getByText('Aeropuerto Internacional de Tocumen')).toBeVisible();
    await expect(page.getByText('Frontera Paso Canoas')).toBeVisible();
    await expect(page.getByText('Frontera Guabito – Almirante')).toBeVisible();
  });

  test('no-op: "Ver en mapa" y "Llamar" no realizan ninguna acción', async ({ page }) => {
    const firstCard = page.locator('div.rounded-xl').filter({ has: page.getByText('Oficina Central') }).first();
    const verEnMapaButton = firstCard.getByRole('button', { name: 'Ver en mapa' });
    const llamarButton = firstCard.getByRole('button', { name: 'Llamar' });

    await verEnMapaButton.click();
    await expect(page.getByRole('heading', { name: 'Oficinas del SNM' })).toBeVisible();

    await llamarButton.click();
    await expect(page.getByRole('heading', { name: 'Oficinas del SNM' })).toBeVisible();
  });
});
