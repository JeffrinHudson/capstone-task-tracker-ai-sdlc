import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results/artifacts',
  // Serial execution prevents race conditions on the shared SQLite database
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { outputFolder: './playwright-report', open: 'never' }]],
  webServer: [
    {
      command: 'npm run dev --workspace=backend',
      url: 'http://localhost:3001/health',
      cwd: '..',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
    {
      command: 'npm run dev --workspace=frontend -- --host 127.0.0.1 --port 4173 --strictPort',
      url: 'http://127.0.0.1:4173',
      cwd: '..',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
});
