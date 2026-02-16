import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import type { ProfileRole } from '@/lib/supabase/types';
import type { User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export interface MiddlewareSessionResult {
  response: NextResponse;
  user: User | null;
  role: ProfileRole | null;
}

export const updateSession = async (request: NextRequest): Promise<MiddlewareSessionResult> => {
  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  type CookieOptions = Parameters<typeof response.cookies.set>[2];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: ReadonlyArray<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          if (options) {
            response.cookies.set(name, value, options);
            return;
          }

          response.cookies.set(name, value);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      response,
      user: null,
      role: null
    };
  }

  const profileResult = await supabase.from('profiles').select('*').eq('auth_id', user.id).single();
  const roleValue = profileResult.data && typeof profileResult.data === 'object'
    ? Reflect.get(profileResult.data, 'role')
    : null;

  const role: ProfileRole | null =
    roleValue === 'customer' || roleValue === 'worker' || roleValue === 'admin' ? roleValue : null;

  return {
    response,
    user,
    role
  };
};
