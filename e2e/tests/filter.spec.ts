import { test, expect } from '@playwright/test';
import { apiCreateTask, clearAllTasks } from './helpers';

test.describe('Feature: Tasks List', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllTasks();
    await apiCreateTask({ title: 'Task A', status: 'TODO' });
    await apiCreateTask({ title: 'Task B', status: 'DONE' });
    await page.goto('/');
  });

  test('shows tasks in table', async ({ page }) => {
    await expect(page.getByTestId('tasks-table')).toBeVisible();
    await expect(page.getByText('Task A')).toBeVisible();
    await expect(page.getByText('Task B')).toBeVisible();
  });
});
