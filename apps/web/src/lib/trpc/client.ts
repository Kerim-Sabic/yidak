import { QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';

import type { AppRouter } from '@yidak/api/trpc/router';

import { createClient as createSupabaseClient } from '@/lib/supabase/client';

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return 'http://localhost:3001';
  }

  return process.env.API_URL ?? 'http://localhost:3001';
};

export const trpc = createTRPCReact<AppRouter>();

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false
      },
      mutations: {
        retry: 1
      }
    }
  });

export const createTrpcClient = () =>
  createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/trpc`,
        transformer: superjson,
        headers: async () => {
          const supabase = createSupabaseClient();
          const {
            data: { session }
          } = await supabase.auth.getSession();

          if (!session?.access_token) {
            return {};
          }

          return {
            authorization: `Bearer ${session.access_token}`
          };
        }
      })
    ]
  });
