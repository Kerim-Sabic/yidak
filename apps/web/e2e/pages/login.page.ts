import { expect, type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/en/login');
  }

  async selectCountry(code: string): Promise<void> {
    await this.page.getByRole('combobox').first().click();
    await this.page.getByRole('option', { name: new RegExp(code, 'i') }).click();
  }

  async enterPhone(phone: string): Promise<void> {
    await this.page.getByRole('textbox').first().fill(phone);
  }

  async sendOtp(): Promise<void> {
    await this.page.getByRole('button', { name: /send otp/i }).click();
  }

  async submitOtp(otp: string): Promise<void> {
    const digits = otp.split('');
    const inputs = this.page.locator('input[inputmode="numeric"]');
    for (let index = 0; index < digits.length; index += 1) {
      await inputs.nth(index).fill(digits[index] ?? '');
    }
  }

  async expectDashboard(): Promise<void> {
    await expect(this.page).toHaveURL(/dashboard/);
  }
}
