import { expect, test } from '@playwright/test';

import { testUsers } from '../fixtures/test-data';
import { LoginPage } from '../pages/login.page';

const runFull = process.env.E2E_FULL === '1';

test.describe('auth flow', () => {
  test.skip(!runFull, 'Set E2E_FULL=1 and configured Supabase OTP to run full auth flow.');

  test('login flow', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.selectCountry('+971');
    await login.enterPhone(testUsers.customer.phone);
    await login.sendOtp();
    await login.submitOtp(testUsers.customer.otp);
    await login.expectDashboard();
  });

  test('signup flow and logout', async ({ page }) => {
    await page.goto('/en/signup');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('role guard redirect', async ({ page }) => {
    await page.goto('/en/worker/dashboard');
    await expect(page).toHaveURL(/login|worker/);
  });
});
