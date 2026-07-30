import { APIRequestContext, expect } from '@playwright/test';

export async function loginAsAdmin(request: APIRequestContext): Promise<string> {
  const response = await request.post('/auth/login', {
    data: { email: 'admin@market.local', password: 'admin123' },
  });
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { accessToken: string };
  expect(body.accessToken).toBeTruthy();
  return body.accessToken;
}

export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}
