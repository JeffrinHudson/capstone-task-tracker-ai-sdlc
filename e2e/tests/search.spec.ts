/**
 * Feature: Search Tasks
 * Spec: e2e/features/search.feature
 */
import { test, expect } from '@playwright/test';
import { clearAllTasks, apiCreateTask } from './helpers';

test.describe('Feature: Search Tasks', () => {
  test.beforeEach(async () => {
    await clearAllTasks();
  });

  // Scenario: Search returns only tasks whose title matches the keyword
  test('shows matching task and hides non-matching task', async ({ page }) => {
    await apiCreateTask({ title: 'Fix the bug' });
    await apiCreateTask({ title: 'Write the docs' });

    await page.goto('/');
    await expect(page.getByTestId('task-row')).toHaveCount(2);

    await page.getByTestId('input-search').fill('bug');

    // Wait for the matching result to confirm the search completed
    await expect(
      page.getByTestId('task-title').filter({ hasText: 'Fix the bug' }),
    ).toBeVisible();
    await expect(
      page.getByTestId('task-title').filter({ hasText: 'Write the docs' }),
    ).not.toBeVisible();
  });

  // Scenario: Search that matches no tasks shows the empty-state message
  test('shows empty-state when no tasks match the search keyword', async ({ page }) => {
    await apiCreateTask({ title: 'Fix the bug' });

    await page.goto('/');
    await expect(page.getByTestId('task-row')).toHaveCount(1);

    await page.getByTestId('input-search').fill('zzznomatch');

    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(
      page.getByTestId('task-title').filter({ hasText: 'Fix the bug' }),
    ).not.toBeVisible();
  });
});
