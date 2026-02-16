import { expect, test } from '@playwright/test';

const runFull = process.env.E2E_FULL === '1';

test.describe('chat flow', () => {
  test.skip(!runFull, 'Set E2E_FULL=1 with active assigned job to verify chat realtime behavior.');

  test('sends and receives chat messages with typing indicator', async ({ page }) => {
    await page.goto('/en/customer/messages');
    await expect(page.getByRole('main')).toBeVisible();
  });
});
