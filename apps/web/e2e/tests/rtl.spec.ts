import { expect, test } from '@playwright/test';

const runFull = process.env.E2E_FULL === '1';

test.describe('rtl flow', () => {
  test.skip(!runFull, 'Set E2E_FULL=1 to verify full Arabic UI interactions and motion directions.');

  test('switches to Arabic and verifies RTL document direction', async ({ page }) => {
    await page.goto('/ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });
});
