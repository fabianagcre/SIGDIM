import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3000';

test.describe('API — ruta inexistente', () => {
  test('responde 404 con mensaje de error en español', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/no-existe`);
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ message: 'Ruta no encontrada' });
  });
});
