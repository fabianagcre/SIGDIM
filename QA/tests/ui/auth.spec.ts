import { test, expect } from '@playwright/test';
import { loginAsAbogado, loginAsSolicitante } from '../helpers/auth';

test.describe('Login', () => {
  test('muestra el formulario con el rol Abogado seleccionado por defecto', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Bienvenido' })).toBeVisible();
    await expect(page.getByPlaceholder('abogado@despacho.pa')).toBeVisible();
  });

  test('cambia el formulario al seleccionar el rol Solicitante', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Solicitante' }).click();
    await expect(page.getByPlaceholder('AB123456 o correo@email.com')).toBeVisible();
    await expect(page.getByText('Crear cuenta como solicitante')).toBeVisible();
  });

  test('permite iniciar sesión como abogado con campos vacíos (sin validación)', async ({ page }) => {
    await loginAsAbogado(page);
  });

  test('permite iniciar sesión como solicitante con campos vacíos (sin validación)', async ({ page }) => {
    await loginAsSolicitante(page);
  });

  test('el botón muestra el estado de carga "Verificando..." mientras autentica', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Ingresar al sistema' }).click();
    await expect(page.getByRole('button', { name: 'Verificando...' })).toBeVisible();
  });

  test('hallazgo: el rol no persiste tras recargar la página', async ({ page }) => {
    await loginAsAbogado(page);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Bienvenido' })).toBeVisible();
  });

  test('no-op: "¿Olvidaste tu contraseña?" no realiza ninguna acción', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click();
    await expect(page.getByRole('heading', { name: 'Bienvenido' })).toBeVisible();
    await expect(page).toHaveURL('/');
  });
});
