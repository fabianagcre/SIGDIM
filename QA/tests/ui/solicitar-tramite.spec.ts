import { test, expect } from '@playwright/test';
import { loginAsSolicitante } from '../helpers/auth';

test.describe('Solicitar Nuevo Trámite (Solicitante)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSolicitante(page);
    await page.getByRole('navigation').getByRole('button', { name: 'Nuevo Trámite', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Solicitar Nuevo Trámite' })).toBeVisible();
  });

  test('paso 1: "Continuar" está deshabilitado hasta seleccionar un tipo', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    await page.getByText('Permiso de Trabajo').click();
    await expect(page.getByText('Documentos requeridos:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  });

  test('paso 2: muestra el trámite elegido y el resumen de requisitos', async ({ page }) => {
    await page.getByText('Permiso de Trabajo').click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Trámite: Permiso de Trabajo')).toBeVisible();
    await expect(page.getByText('Permiso de Trabajo · 9 documentos')).toBeVisible();
  });

  test('BUG: el resumen del paso 3 no refleja los datos ingresados por el usuario', async ({ page }) => {
    await page.getByText('Permiso de Trabajo').click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page.getByPlaceholder('Ej. James William Scott').fill('Test QA Nombre');
    await page.getByPlaceholder('Ej. AB1234567').fill('QA0000000');
    await page.getByPlaceholder('correo@ejemplo.com').fill('qa@example.com');

    await page.getByRole('button', { name: 'Revisar solicitud' }).click();

    // Defecto confirmado: el formulario del paso 2 es completamente no-controlado,
    // así que el resumen sigue mostrando los valores hardcodeados en vez de los reales.
    await expect(page.getByText('Test QA Nombre')).toHaveCount(0);
    await expect(page.getByText('James William Scott')).toBeVisible();
    await expect(page.getByText('AB1234567')).toBeVisible();
  });

  test('el campo "Tipo de trámite" del resumen sí refleja la selección real', async ({ page }) => {
    await page.getByText('Naturalización').click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Revisar solicitud' }).click();
    await expect(page.getByText('Naturalización').first()).toBeVisible();
  });

  test('hallazgo: "Enviar solicitud" resetea el wizard sin ninguna confirmación de éxito', async ({ page }) => {
    await page.getByText('Naturalización').click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Revisar solicitud' }).click();
    await page.getByRole('button', { name: 'Enviar solicitud' }).click();

    // "Enviar solicitud" solo llama a setStep(1); nunca limpia `selected` (setSelected
    // solo se invoca al elegir una tarjeta en el paso 1 — ver App.tsx líneas 1303 y 1333).
    // Por lo tanto, al volver al paso 1 la tarjeta "Naturalización" sigue seleccionada y
    // "Continuar" queda habilitado (disabled={!selected}, línea 1391) — no deshabilitado.
    await expect(page.getByRole('button', { name: 'Continuar' })).toBeEnabled();
    await expect(page.getByText(/enviada con éxito/i)).toHaveCount(0);
  });

  test('la selección de tipo persiste al volver del paso 2 al paso 1', async ({ page }) => {
    await page.getByText('Naturalización').click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Atrás' }).click();
    await expect(page.getByText('Documentos requeridos:')).toBeVisible();
  });

  test('hallazgo: los campos del paso 2 no se conservan al ir a paso 3 y volver', async ({ page }) => {
    await page.getByText('Naturalización').click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByPlaceholder('Ej. James William Scott').fill('Test QA Nombre');
    await page.getByRole('button', { name: 'Revisar solicitud' }).click();
    await page.getByRole('button', { name: 'Atrás' }).click();
    await expect(page.getByPlaceholder('Ej. James William Scott')).toHaveValue('');
  });
});
