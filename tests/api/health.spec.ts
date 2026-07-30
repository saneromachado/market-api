import { expect, test } from '@playwright/test';

test.describe('Saúde da API', () => {
  test('GET /health responde sem autenticação', async ({ request }) => {
    const response = await request.get('/health');

    expect(response.status()).toBe(200);
    await expect(response).toBeOK();
    await expect(response.json()).resolves.toMatchObject({
      status: 'ok',
      service: 'market-api',
    });
  });
});
