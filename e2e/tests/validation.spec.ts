/**
 * Feature: Task Form Validation
 * Spec: e2e/features/validation.feature
 */
import { test, expect } from '@playwright/test';
import { clearAllTasks } from './helpers';

test.describe('Feature: Task Form Validation', () => {
  test.beforeEach(async () => {
    await clearAllTasks();
  });

  // Scenario: Submit the form without a title shows a required-field error
  test('shows "Title is required" and keeps modal open when saving without a title', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByTestId('btn-new-task').click();
    await expect(page.getByTestId('task-modal')).toBeVisible();

    await page.getByTestId('btn-save').click();

    await expect(page.getByTestId('error-title')).toHaveText('Title is required');
    await expect(page.getByTestId('task-modal')).toBeVisible();
  });

  // Scenario: Typing a title after the error clears the error and saves
  test('saves successfully after typing a title following a validation error', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('btn-new-task').click();
    // Trigger the error first
    await page.getByTestId('btn-save').click();
    await expect(page.getByTestId('error-title')).toBeVisible();

    // Now type a title and save
    await page.getByTestId('input-title').fill('My task');
    await page.getByTestId('btn-save').click();

    await expect(page.getByTestId('task-modal')).not.toBeVisible();
    await expect(
      page.getByTestId('task-title').filter({ hasText: 'My task' }),
    ).toBeVisible();
  });
});
