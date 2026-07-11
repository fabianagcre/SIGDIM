import { Page, expect } from '@playwright/test';

export async function loginAsAbogado(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ingresar al sistema' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
}

export async function loginAsSolicitante(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Solicitante' }).click();
  await page.getByRole('button', { name: 'Ingresar al sistema' }).click();
  await expect(page.getByRole('heading', { name: 'Bienvenida, María', exact: true })).toBeVisible();
}
