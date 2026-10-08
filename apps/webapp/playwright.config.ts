import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: undefined,
  // One retry on CI: a test that only passes on retry is reported as flaky
  retries: process.env.CI ? 1 : 0,
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:5199',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 800 },
  },
  webServer: [
    {
      command: 'npx vite --port 5199',
      port: 5199,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      // Local Jazz sync server for the multi-device specs in tests/e2e/sync
      command: 'npx jazz-run sync --in-memory',
      port: 4200,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  ],
});
