import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mutateAsync = vi.fn(async () => ({ id: 'payment-1' }));

vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    payment: {
      authorizeEscrow: {
        useMutation: () => ({
          mutateAsync,
          isPending: false,
        }),
      },
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { PaymentFlow } from '../PaymentFlow';

import { renderWithIntl } from './test-utils';

describe('PaymentFlow', () => {
  beforeEach(() => {
    mutateAsync.mockClear();
  });

  it('renders empty state when no payment selected', () => {
    renderWithIntl(<PaymentFlow locale="en" data={null} />);
    expect(screen.getByText('emptySelection')).toBeInTheDocument();
  });

  it('runs authorization step for pending payment', async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <PaymentFlow
        locale="en"
        data={{
          id: 'payment-1',
          jobId: 'job-1',
          bidId: 'bid-1',
          jobTitle: 'AC Repair',
          amount: 150,
          currency: 'AED',
          status: 'pending',
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'actions.continue' }));
    await user.click(screen.getByRole('button', { name: 'actions.authorize' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        job_id: 'job-1',
        bid_id: 'bid-1',
        amount: 150,
        currency: 'AED',
      });
    });
  });
});
