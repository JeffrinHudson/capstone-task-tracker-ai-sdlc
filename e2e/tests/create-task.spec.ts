/**
 * Feature: Create Task
 * Spec: e2e/features/create-task.feature
 */
import { test, expect } from '@playwright/test';
import { clearAllTasks } from './helpers';

test.describe('Feature: Create Task', () => {
  test.beforeEach(async () => {
    await clearAllTasks();
  });

  // Scenario: Create a task with title only
  test('creates a task with title only', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('btn-new-task').click();
    await expect(page.getByTestId('task-modal')).toBeVisible();

    await page.getByTestId('input-title').fill('Buy groceries');
    await page.getByTestId('btn-save').click();

    await expect(page.getByTestId('task-modal')).not.toBeVisible();
    await expect(
      page.getByTestId('task-title').filter({ hasText: 'Buy groceries' }),
    ).toBeVisible();
  });

  // Scenario: Create a task with all fields filled
  test('creates a task with all fields', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('btn-new-task').click();
    await page.getByTestId('input-title').fill('Deploy to production');
    await page.getByTestId('input-description').fill('Final deployment steps');
    await page.getByTestId('select-priority').selectOption('HIGH');
    await page.getByTestId('input-due-date').fill('2026-12-31');
    await page.getByTestId('btn-save').click();

    await expect(page.getByTestId('task-modal')).not.toBeVisible();

    const row = page.getByTestId('task-row').filter({
      has: page.getByTestId('task-title').filter({ hasText: 'Deploy to production' }),
    });
    await expect(row.getByTestId('task-priority')).toHaveText('HIGH');
  });
});
