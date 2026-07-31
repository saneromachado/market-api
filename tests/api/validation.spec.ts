import { expect, test } from '@playwright/test';

import { bearer, loginAsAdmin } from './helpers';

test.describe('Validação de contrato', () => {
  test('rejeita campos desconhecidos e valores inválidos', async ({ request }) => {
    const token = await loginAsAdmin(request);
    const response = await request.post('categories', {
      headers: bearer(token),
      data: { name: 'A', unexpectedField: true },
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.statusCode).toBe(400);
    expect(body.message).toEqual(
      expect.arrayContaining([
        'property unexpectedField should not exist',
        expect.stringContaining('name must be longer than or equal to 2'),
      ]),
    );
  });
});
