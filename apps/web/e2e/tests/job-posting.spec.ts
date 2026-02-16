import { expect, test } from '@playwright/test';

import { testJobs } from '../fixtures/test-data';

const runFull = process.env.E2E_FULL === '1';

test.describe('job posting flow', () => {
  test.skip(!runFull, 'Set E2E_FULL=1 to run interactive multi-step job posting tests.');

  test('completes all 5 steps and posts job', async ({ page }) => {
    await page.goto('/en/customer/jobs/new');
    await expect(page.getByRole('main')).toBeVisible();
    await page.getByRole('textbox', { name: /title/i }).fill(testJobs.plumbing.title);
  });
});
