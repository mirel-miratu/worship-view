import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  // One retry on CI: a test that only passes on retry is reported as flaky
  retries: process.env.CI ? 1 : 0,
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  reporter: [['html'], ['list']],
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
