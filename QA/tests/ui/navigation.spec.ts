import { test, expect } from '@playwright/test';
import { loginAsAbogado, loginAsSolicitante } from '../helpers/auth';

test.describe('Navegación — portal Abogado', () => {
  test('cada ítem del sidebar cambia la vista y no cambia la URL', async ({ page }) => {
    await loginAsAbogado(page);

    const cases: Array<[string, string]> = [
      ['Expedientes', 'Expedientes'],
      ['Clientes', 'Clientes'],
      ['Configuración', 'Configuración'],
      ['Dashboard', 'Dashboard'],
    ];

    for (const [navLabel, heading] of cases) {
      const navButton = page.getByRole('button', { name: navLabel, exact: true });
      await navButton.click();
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      await expect(page).toHaveURL('/');
      await expect(navButton).toHaveCSS('border-left-color', 'rgb(41, 128, 185)');
    }
  });

  test('"Cerrar sesión" regresa a la pantalla de login', async ({ page }) => {
    await loginAsAbogado(page);
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page.getByRole('heading', { name: 'Bienvenido' })).toBeVisible();
  });
});

test.describe('Navegación — portal Solicitante', () => {
  test('cada ítem del sidebar cambia la vista y no cambia la URL', async ({ page }) => {
    await loginAsSolicitante(page);

    const cases: Array<[string, string]> = [
      ['Mis Trámites', 'Mis Trámites'],
      ['Nuevo Trámite', 'Solicitar Nuevo Trámite'],
      ['Oficinas', 'Oficinas del SNM'],
      ['Ayuda', 'Centro de Ayuda'],
      ['Inicio', 'Bienvenida, María'],
    ];

    for (const [navLabel, heading] of cases) {
      const navButton = page.getByRole('navigation').getByRole('button', { name: navLabel, exact: true });
      await navButton.click();
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      await expect(page).toHaveURL('/');
      await expect(navButton).toHaveCSS('border-left-color', 'rgb(41, 128, 185)');
    }
  });

  test('"Cerrar sesión" regresa a la pantalla de login', async ({ page }) => {
    await loginAsSolicitante(page);
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page.getByRole('heading', { name: 'Bienvenido' })).toBeVisible();
  });
});
