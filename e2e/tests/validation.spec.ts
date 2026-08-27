import { test, expect } from '@playwright/test';
import { clearAllTasks } from './helpers';

test.describe('Feature: Task Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllTasks();
    await page.goto('/');
  });

  test('shows "Title is required" and keeps modal open when saving without a title', async ({
    page,
  }) => {
    await page.getByTestId('tasks-new-btn').click();
    await page.getByTestId('task-save-btn').click();

    await expect(page.getByTestId('task-form-page')).toBeVisible();
    await expect(page.getByTestId('error-title')).toBeVisible();
  });

  test('shows due date validation error when due date is in the past', async ({ page }) => {
    await page.getByTestId('tasks-new-btn').click();
    await page.getByTestId('task-title-input').fill('Past date task');

    await page.getByTestId('task-dueDate-input').fill('2000-01-01');
    await page.getByTestId('task-save-btn').click();

    await expect(page.getByTestId('task-form-page')).toBeVisible();
    await expect(page.getByTestId('error-dueDate')).toBeVisible();
  });

  test('saves successfully after typing a title following a validation error', async ({ page }) => {
    await page.getByTestId('tasks-new-btn').click();
    await page.getByTestId('task-save-btn').click();

    await page.getByTestId('task-title-input').fill('Now valid');
    await page.getByTestId('task-save-btn').click();

    await expect(page.getByText('Now valid')).toBeVisible();
  });
});
