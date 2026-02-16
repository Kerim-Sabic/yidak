import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/en/customer/dashboard'
}));

import { LanguageSwitcher } from '../LanguageSwitcher';

describe('LanguageSwitcher', () => {
  it('switches locale and updates route', async () => {
    const user = userEvent.setup();
    const onLocaleChange = vi.fn();

    render(<LanguageSwitcher locale="en" onLocaleChange={onLocaleChange} />);

    await user.click(screen.getByRole('button', { name: /switch language/i }));

    expect(onLocaleChange).toHaveBeenCalledWith('ar');
    expect(push).toHaveBeenCalledWith('/ar/customer/dashboard');
  });
});
