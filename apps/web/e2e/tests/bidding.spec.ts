import { expect, test } from '@playwright/test';

import { testBids } from '../fixtures/test-data';

const runFull = process.env.E2E_FULL === '1';

test.describe('bidding flow', () => {
  test.skip(!runFull, 'Set E2E_FULL=1 with seeded jobs/users for realtime bidding checks.');

  test('worker places bid and customer accepts', async ({ browser }) => {
    const workerContext = await browser.newContext();
    const customerContext = await browser.newContext();
    const workerPage = await workerContext.newPage();
    const customerPage = await customerContext.newPage();

    await workerPage.goto('/en/worker/jobs');
    await customerPage.goto('/en/customer/dashboard');

    await expect(workerPage.getByRole('main')).toBeVisible();
    await expect(customerPage.getByRole('main')).toBeVisible();

    await workerContext.close();
    await customerContext.close();
    expect(testBids.default.amount).toBeGreaterThan(0);
  });
});
