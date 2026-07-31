import { expect, test } from '@playwright/test';

test.describe('Autenticação', () => {
  test('retorna token para credenciais válidas', async ({ request }) => {
    const response = await request.post('auth/login', {
      data: { email: 'admin@market.local', password: 'admin123' },
    });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body).toMatchObject({
      tokenType: 'Bearer',
      user: { email: 'admin@market.local', role: 'ADMIN' },
    });
    expect(body.accessToken).toEqual(expect.any(String));
  });

  test('rejeita senha inválida com contrato padronizado', async ({ request }) => {
    const response = await request.post('auth/login', {
      data: { email: 'admin@market.local', password: 'senha-errada' },
    });
    const body = await response.json();

    expect(response.status()).toBe(401);
    expect(body).toMatchObject({
      statusCode: 401,
      message: 'E-mail ou senha inválidos',
      path: '/api/auth/login',
    });
    expect(body.timestamp).toEqual(expect.any(String));
  });

  test('bloqueia endpoint protegido sem token', async ({ request }) => {
    const response = await request.get('products');
    expect(response.status()).toBe(401);
  });
});
