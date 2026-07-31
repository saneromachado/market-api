import { defineConfig } from '@playwright/test';

const apiBaseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:3000/api';

export default defineConfig({
  testDir: './tests/api',
  fullyParallel: true,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `${apiBaseUrl.replace(/\/+$/, '')}/`,
    extraHTTPHeaders: { Accept: 'application/json' },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run start:test',
    url: 'http://127.0.0.1:3000/api/health',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
