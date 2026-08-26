import { test, expect } from '@playwright/test';

// placeholder — add e2e tests here
test.skip('app loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Task Tracker/);
});
