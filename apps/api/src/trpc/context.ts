import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';

import type { User } from '@supabase/supabase-js';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import type { Database } from '@yidak/db';

const currentDir = dirname(fileURLToPath(import.meta.url));
const apiDir = resolve(currentDir, '..', '..');
const rootDir = resolve(apiDir, '..', '..');

loadEnv({ path: resolve(rootDir, '.env.local') });
loadEnv({ path: resolve(rootDir, '.env') });
loadEnv({ path: resolve(apiDir, '.env.local') });
loadEnv({ path: resolve(apiDir, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL and auth key (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)',
  );
}

export interface Context {
  supabase: ReturnType<typeof createClient<Database>>;
  user: User | null;
  profile: Database['public']['Tables']['profiles']['Row'] | null;
  req: Request;
}

const readBearerToken = (authorizationHeader: string | null): string | null => {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.slice(7).trim();
};

const getProfileByAuthId = async (
  supabase: ReturnType<typeof createClient<Database>>,
  authId: string,
): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', authId)
    .maybeSingle()
    .returns<Database['public']['Tables']['profiles']['Row']>();

  return data;
};

export const createContext = async (opts: FetchCreateContextFnOptions): Promise<Context> => {
  const authHeader = opts.req.headers.get('authorization');

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);
  const token = readBearerToken(authHeader);

  if (!token) {
    return {
      supabase,
      user: null,
      profile: null,
      req: opts.req,
    };
  }

  const { data } = await supabase.auth.getUser(token);
  const user = data.user;

  if (!user) {
    return {
      supabase,
      user: null,
      profile: null,
      req: opts.req,
    };
  }

  const profile = await getProfileByAuthId(supabase, user.id);

  return {
    supabase,
    user,
    profile,
    req: opts.req,
  };
};
