import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mutateAsync = vi.fn(async () => ({ ok: true }));

vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    review: {
      create: {
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

import { ReviewForm } from '../ReviewForm';

import { renderWithIntl } from './test-utils';

describe('ReviewForm', () => {
  beforeEach(() => {
    mutateAsync.mockClear();
  });

  it('submits worker review when required fields are filled', async () => {
    const user = userEvent.setup();

    renderWithIntl(<ReviewForm locale="en" jobId="job-1" mode="worker" />);

    await user.click(screen.getByLabelText('rows.overall 5'));
    await user.type(
      screen.getByPlaceholderText('reviewPlaceholder'),
      'Very professional and reliable service with excellent communication.',
    );

    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1);
    });
  });
});
