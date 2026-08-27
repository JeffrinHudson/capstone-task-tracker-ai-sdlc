import { test, expect } from '@playwright/test';
import { apiCreateTask, clearAllTasks } from './helpers';

test.describe('Feature: Tasks List', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllTasks();
    await apiCreateTask({ title: 'Write report' });
    await apiCreateTask({ title: 'Book flights' });
    await page.goto('/');
  });

  test('app loads', async ({ page }) => {
    await expect(page.getByTestId('tasks-list-page')).toBeVisible();
  });

  test('shows tasks', async ({ page }) => {
    await expect(page.getByText('Write report')).toBeVisible();
    await expect(page.getByText('Book flights')).toBeVisible();
  });
});
