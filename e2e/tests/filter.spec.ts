import { test, expect } from '@playwright/test';
import { apiCreateTask, clearAllTasks } from './helpers';

function nextDateOnly(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

test.describe('Feature: Tasks List', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllTasks();
    await apiCreateTask({ title: 'Task A', status: 'TODO', dueDate: nextDateOnly(2) });
    await apiCreateTask({ title: 'Task B', status: 'DONE', dueDate: nextDateOnly(10) });
    await apiCreateTask({ title: 'Task C', status: 'DONE' });
    await page.goto('/');
  });

  test('shows tasks in table', async ({ page }) => {
    await expect(page.getByTestId('tasks-table')).toBeVisible();
    await expect(page.getByText('Task A')).toBeVisible();
    await expect(page.getByText('Task B')).toBeVisible();
  });

  test('filters tasks by due date window', async ({ page }) => {
    await page.getByTestId('tasks-due-after-input').fill(nextDateOnly(1));
    await page.getByTestId('tasks-due-before-input').fill(nextDateOnly(5));
    await page.getByTestId('tasks-apply-filters-btn').click();

    await expect(page.getByText('Task A')).toBeVisible();
    await expect(page.getByText('Task B')).not.toBeVisible();
    await expect(page.getByText('Task C')).not.toBeVisible();

    await page.getByTestId('tasks-reset-filters-btn').click();
    await page.getByTestId('tasks-apply-filters-btn').click();

    await expect(page.getByText('Task A')).toBeVisible();
    await expect(page.getByText('Task B')).toBeVisible();
    await expect(page.getByText('Task C')).toBeVisible();
  });
});
