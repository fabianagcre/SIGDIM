import { test, expect } from '@playwright/test';

test.describe('Registro de Solicitante (real, contra el backend)', () => {
  test('valida contraseña corta y confirmación antes de llamar al backend', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Solicitante' }).click();
    await page.getByText('Crear cuenta como solicitante').click();
    await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible();

    await page.getByPlaceholder('Ej. María González').fill('Smoke Test');
    await page.getByPlaceholder('Ej. PA1234567').fill('PA0000001');
    await page.getByPlaceholder('correo@email.com').fill('smoke.corta@example.com');
    await page.getByPlaceholder('Mínimo 8 caracteres').fill('123');
    await page.getByPlaceholder('••••••••').fill('123');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page.getByText('La contraseña debe tener al menos 8 caracteres.')).toBeVisible();

    await page.getByPlaceholder('Mínimo 8 caracteres').fill('Password123!');
    await page.getByPlaceholder('••••••••').fill('Otra12345!');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible();
  });

  test('"Inicia sesión" regresa al formulario de login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Solicitante' }).click();
    await page.getByText('Crear cuenta como solicitante').click();
    await page.getByText('Inicia sesión').click();
    await expect(page.getByRole('heading', { name: 'Bienvenido' })).toBeVisible();
  });

  test('registro exitoso crea la cuenta en el backend y entra directo al portal', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Solicitante' }).click();
    await page.getByText('Crear cuenta como solicitante').click();

    const email = `qa.registro.${Date.now()}@example.com`;
    await page.getByPlaceholder('Ej. María González').fill('QA Registro');
    await page.getByPlaceholder('Ej. PA1234567').fill(`PA${Date.now() % 10000000}`);
    await page.getByPlaceholder('correo@email.com').fill(email);
    await page.getByPlaceholder('Mínimo 8 caracteres').fill('Password123!');
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page.getByRole('heading', { name: 'Bienvenida, María' })).toBeVisible({ timeout: 8000 });
  });

  test('registrar un correo ya usado devuelve el error del backend (409)', async ({ page }) => {
    const email = `qa.duplicado.${Date.now()}@example.com`;

    await page.goto('/');
    await page.getByRole('button', { name: 'Solicitante' }).click();
    await page.getByText('Crear cuenta como solicitante').click();
    await page.getByPlaceholder('Ej. María González').fill('Primero');
    await page.getByPlaceholder('Ej. PA1234567').fill(`PA${Date.now() % 10000000}`);
    await page.getByPlaceholder('correo@email.com').fill(email);
    await page.getByPlaceholder('Mínimo 8 caracteres').fill('Password123!');
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page.getByRole('heading', { name: 'Bienvenida, María' })).toBeVisible({ timeout: 8000 });

    await page.reload();
    await page.getByRole('button', { name: 'Solicitante' }).click();
    await page.getByText('Crear cuenta como solicitante').click();
    await page.getByPlaceholder('Ej. María González').fill('Segundo');
    await page.getByPlaceholder('Ej. PA1234567').fill(`PA${(Date.now() + 7) % 10000000}`);
    await page.getByPlaceholder('correo@email.com').fill(email);
    await page.getByPlaceholder('Mínimo 8 caracteres').fill('Password123!');
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page.getByText('Ya existe una cuenta con ese correo o pasaporte')).toBeVisible({ timeout: 8000 });
  });
});
