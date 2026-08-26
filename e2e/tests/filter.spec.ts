/**
 * Feature: Filter Tasks by Status
 * Spec: e2e/features/filter.feature
 */
import { test, expect } from '@playwright/test';
import { clearAllTasks, apiCreateTask, apiPatchStatus } from './helpers';

test.describe('Feature: Filter Tasks by Status', () => {
  test.beforeEach(async () => {
    await clearAllTasks();
    const open = await apiCreateTask({ title: 'Write tests' });
    const done = await apiCreateTask({ title: 'Read README' });
    await apiPatchStatus(done.id, 'DONE');
    // Suppress unused-variable warning; ids are used via side-effects above
    void open;
  });

  // Scenario: Selecting "Open" shows only open tasks
  test('shows only open tasks when Open filter is selected', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('select-status-filter').selectOption('OPEN');

    await expect(
      page.getByTestId('task-title').filter({ hasText: 'Write tests' }),
    ).toBeVisible();
    await expect(
      page.getByTestId('task-title').filter({ hasText: 'Read README' }),
    ).not.toBeVisible();
  });

  // Scenario: Selecting "Done" shows only completed tasks
  test('shows only done tasks when Done filter is selected', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('select-status-filter').selectOption('DONE');

    await expect(
      page.getByTestId('task-title').filter({ hasText: 'Read README' }),
    ).toBeVisible();
    await expect(
      page.getByTestId('task-title').filter({ hasText: 'Write tests' }),
    ).not.toBeVisible();
  });

  // Scenario: Selecting "All" shows every task regardless of status
  test('shows all tasks when All filter is selected', async ({ page }) => {
    await page.goto('/');

    // Default is All; explicitly select it to mirror the Gherkin step
    await page.getByTestId('select-status-filter').selectOption('ALL');

    await expect(
      page.getByTestId('task-title').filter({ hasText: 'Write tests' }),
    ).toBeVisible();
    await expect(
      page.getByTestId('task-title').filter({ hasText: 'Read README' }),
    ).toBeVisible();
  });
});
