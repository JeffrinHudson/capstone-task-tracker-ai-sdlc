import { test, expect } from '@playwright/test';
import { apiCreateTask, clearAllTasks } from './helpers';

test.describe('Feature: Tasks List Due Dates', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllTasks();
    await apiCreateTask({ title: 'No due date', dueDate: null });
    await apiCreateTask({ title: 'Has due date', dueDate: '2099-12-31' });
    await page.goto('/');
  });

  test('renders due date string or dash', async ({ page }) => {
    await expect(page.getByText('Has due date')).toBeVisible();
    await expect(page.getByText('2099-12-31')).toBeVisible();
    await expect(page.getByText('No due date')).toBeVisible();
    await expect(page.getByText('—')).toBeVisible();
  });
});
