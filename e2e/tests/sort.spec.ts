/**
 * Feature: Sort Tasks by Due Date
 * Spec: e2e/features/sort.feature
 */
import { test, expect } from '@playwright/test';
import { clearAllTasks, apiCreateTask } from './helpers';

test.describe('Feature: Sort Tasks by Due Date', () => {
  test.beforeEach(async () => {
    await clearAllTasks();
  });

  // Scenario: Ascending sort places the earliest due date first
  test('ascending sort shows earliest-due task first', async ({ page }) => {
    await apiCreateTask({ title: 'Early Task', dueDate: '2026-09-01' });
    await apiCreateTask({ title: 'Late Task', dueDate: '2026-12-31' });

    await page.goto('/');

    await page.getByTestId('select-sort').selectOption('asc');

    const rows = page.getByTestId('task-row');
    await expect(rows.nth(0).getByTestId('task-title')).toHaveText('Early Task');
    await expect(rows.nth(1).getByTestId('task-title')).toHaveText('Late Task');
  });

  // Scenario: Descending sort places the latest due date first
  test('descending sort shows latest-due task first', async ({ page }) => {
    await apiCreateTask({ title: 'Early Task', dueDate: '2026-09-01' });
    await apiCreateTask({ title: 'Late Task', dueDate: '2026-12-31' });

    await page.goto('/');

    await page.getByTestId('select-sort').selectOption('desc');

    const rows = page.getByTestId('task-row');
    await expect(rows.nth(0).getByTestId('task-title')).toHaveText('Late Task');
    await expect(rows.nth(1).getByTestId('task-title')).toHaveText('Early Task');
  });

  // Scenario: Tasks without a due date always appear last in ascending sort
  test('tasks without a due date appear after tasks with a due date', async ({ page }) => {
    await apiCreateTask({ title: 'No Due Date' });
    await apiCreateTask({ title: 'Has Due Date', dueDate: '2026-09-01' });

    await page.goto('/');

    await page.getByTestId('select-sort').selectOption('asc');

    const rows = page.getByTestId('task-row');
    await expect(rows.nth(0).getByTestId('task-title')).toHaveText('Has Due Date');
    await expect(rows.nth(1).getByTestId('task-title')).toHaveText('No Due Date');
  });
});
