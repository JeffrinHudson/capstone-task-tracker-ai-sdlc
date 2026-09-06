import { test, expect } from '@playwright/test';
import { clearAllTasks } from './helpers';

test.describe('Feature: Create Task', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllTasks();
    await page.goto('/');
  });

  test('creates a task with title only', async ({ page }) => {
    await page.getByTestId('tasks-new-btn').click();

    await page.getByTestId('task-title-input').fill('Write report');
    await page.getByTestId('task-save-btn').click();

    await expect(page.getByText('Write report')).toBeVisible();
  });

  test('creates a task with all fields', async ({ page }) => {
    await page.getByTestId('tasks-new-btn').click();

    await page.getByTestId('task-title-input').fill('Book flights');
    await page.getByTestId('task-status-select').selectOption('IN_PROGRESS');
    await page.getByTestId('task-dueDate-input').fill('2099-12-31');

    await page.getByTestId('task-save-btn').click();

    await expect(page.getByText('Book flights')).toBeVisible();
    const row = page.locator('tr', { hasText: 'Book flights' });
    await expect(row.getByText('IN_PROGRESS')).toBeVisible();
    await expect(page.getByText('2099-12-31')).toBeVisible();
  });
});
