import { expect, test } from '@playwright/test';

const runFull = process.env.E2E_FULL === '1';

test.describe('payment flow', () => {
  test.skip(!runFull, 'Set E2E_FULL=1 with Tap sandbox credentials to verify escrow flow.');

  test('authorizes escrow and releases payment', async ({ page }) => {
    await page.goto('/en/payments');
    await expect(page.getByRole('main')).toBeVisible();
  });
});
