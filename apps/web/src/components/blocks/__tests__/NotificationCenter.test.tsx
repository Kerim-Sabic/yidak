import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const markReadMutateAsync = vi.fn(async () => ({ ok: true }));
const dismissMutateAsync = vi.fn(async () => ({ ok: true }));

const invalidate = vi.fn(async () => undefined);

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    role: 'customer',
    profile: { id: 'profile-1' },
  }),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/dashboard',
}));

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: () => ({
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
      subscribe: () => ({}),
    }),
    removeChannel: async () => undefined,
  }),
}));

vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    useUtils: () => ({
      notification: {
        list: { invalidate },
        getUnreadCount: { invalidate },
      },
    }),
    notification: {
      list: {
        useInfiniteQuery: () => ({
          data: {
            pages: [
              {
                items: [
                  {
                    id: 'n1',
                    type: 'new_bid',
                    title: 'New bid',
                    body: 'You have a new bid',
                    is_read: false,
                    created_at: new Date().toISOString(),
                  },
                ],
                nextCursor: null,
              },
            ],
          },
          isLoading: false,
          hasNextPage: false,
          isFetchingNextPage: false,
          fetchNextPage: async () => undefined,
        }),
      },
      getUnreadCount: {
        useQuery: () => ({ data: { unread_count: 1 } }),
      },
      markRead: {
        useMutation: () => ({
          mutateAsync: markReadMutateAsync,
        }),
      },
      dismiss: {
        useMutation: () => ({
          mutateAsync: dismissMutateAsync,
        }),
      },
    },
  },
}));

import { NotificationCenter } from '../NotificationCenter';

import { renderWithIntl } from './test-utils';

describe('NotificationCenter', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query.includes('max-width') ? false : false,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => true,
      }),
    });
  });

  beforeEach(() => {
    markReadMutateAsync.mockClear();
    dismissMutateAsync.mockClear();
    invalidate.mockClear();
  });

  it('renders notification list in page mode', () => {
    renderWithIntl(<NotificationCenter mode="page" />);
    expect(screen.getByText('New bid')).toBeInTheDocument();
  });

  it('marks all notifications as read', async () => {
    const user = userEvent.setup();
    renderWithIntl(<NotificationCenter mode="page" />);

    await user.click(screen.getByRole('button', { name: 'markAllRead' }));
    expect(markReadMutateAsync).toHaveBeenCalledWith({ all: true });
  });
});
