import { defineConfig } from '@playwright/test';

// End-to-end tests run against the real API (in-memory demo store) and the Vite dev server.
// Locally: `npm run e2e`. Set PW_CHROMIUM=/path/to/chromium to use a pre-installed browser.
export default defineConfig({
  testDir: './e2e',
  workers: 1, // the demo server's data is shared between tests
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: process.env.CI ? [['list'], ['github']] : [['list']],
  use: {
    baseURL: 'http://localhost:1420',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  webServer: [
    {
      command: 'npm run dev:server',
      cwd: '../..',
      url: 'http://localhost:8080/health',
      env: {
        DATA_STORE: 'memory',
        PORT: '8080',
        LOGIN_RATE_MAX: '1000',
        RATE_LIMIT_MAX: '100000',
        BCRYPT_ROUNDS: '4',
      },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:1420',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
