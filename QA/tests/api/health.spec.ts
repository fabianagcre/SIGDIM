import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3000';

test.describe('API /api/health', () => {
  test('responde 200 con el shape esperado', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/health`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', service: 'sigdim-api' });
  });

  test('incluye el header CORS para el frontend', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/health`);
    expect(response.headers()['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
