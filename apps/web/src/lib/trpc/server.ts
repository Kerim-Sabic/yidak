import { createClient } from '@supabase/supabase-js';
import { appRouter, type AppRouter } from '@yidak/api/trpc/router';

import type { Context } from '@yidak/api/trpc/context';
import type { Database } from '@yidak/db';

const getEnvOrFallback = (name: string, fallback: string): string => process.env[name] ?? fallback;

const buildContext = async (authToken?: string): Promise<Context> => {
  const supabaseUrl = getEnvOrFallback('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
  const serviceRoleKey = getEnvOrFallback(
    'SUPABASE_SERVICE_ROLE_KEY',
    'supabase-service-role-key-not-configured'
  );
  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);
  const req = new Request('http://localhost/trpc', {
    headers: authToken
      ? {
          authorization: `Bearer ${authToken}`
        }
      : {}
  });

  if (!authToken) {
    return {
      supabase,
      user: null,
      profile: null,
      req
    };
  }

  const userResult = await supabase.auth.getUser(authToken);
  const user = userResult.data.user;

  if (!user) {
    return {
      supabase,
      user: null,
      profile: null,
      req
    };
  }

  const profileResult = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', user.id)
    .maybeSingle()
    .returns<Database['public']['Tables']['profiles']['Row']>();

  return {
    supabase,
    user,
    profile: profileResult.data,
    req
  };
};

export const getServerCaller = async (authToken?: string) => appRouter.createCaller(await buildContext(authToken));

export type ServerCaller = Awaited<ReturnType<typeof getServerCaller>>;
export type { AppRouter };
