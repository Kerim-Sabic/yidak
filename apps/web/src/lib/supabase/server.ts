import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import type { User } from '@supabase/supabase-js';

import { ROLE_DASHBOARD_PATH, type ProfileRole, type ProfileRow } from '@/lib/supabase/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const toLocalizedPath = (locale: string | undefined, path: string): string => {
  if (!locale) {
    return path;
  }

  return `/${locale}${path}`;
};

const isProfileRole = (value: unknown): value is ProfileRole =>
  value === 'customer' || value === 'worker' || value === 'admin';

const readField = (target: object, field: string): unknown => Reflect.get(target, field);

const isProfileRow = (value: unknown): value is ProfileRow => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const id = readField(value, 'id');
  const authId = readField(value, 'auth_id');
  const role = readField(value, 'role');
  const fullName = readField(value, 'full_name');

  return (
    typeof id === 'string' &&
    typeof authId === 'string' &&
    isProfileRole(role) &&
    typeof fullName === 'string'
  );
};

export const createClient = async () => {
  const cookieStore = await cookies();
  type CookieOptions = Parameters<typeof cookieStore.set>[2];

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: ReadonlyArray<{ name: string; value: string; options?: CookieOptions }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (options) {
              cookieStore.set(name, value, options);
              return;
            }

            cookieStore.set(name, value);
          });
        } catch {
          return;
        }
      }
    }
  });
};

export const getAuthUser = async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
};

export const getProfile = async (): Promise<ProfileRow | null> => {
  const user = await getAuthUser();
  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('profiles').select('*').eq('auth_id', user.id).single();

  if (error || !isProfileRow(data)) {
    return null;
  }

  return data;
};

export const requireAuth = async (locale?: string): Promise<User> => {
  const user = await getAuthUser();

  if (!user) {
    redirect(toLocalizedPath(locale, '/login'));
  }

  return user;
};

export const requireRole = async (
  role: ProfileRole,
  locale?: string
): Promise<ProfileRow> => {
  const profile = await getProfile();

  if (!profile) {
    redirect(toLocalizedPath(locale, '/login'));
  }

  if (profile.role !== role) {
    redirect(toLocalizedPath(locale, '/unauthorized'));
  }

  return profile;
};

export const getRoleDashboardPath = (role: ProfileRole): string => ROLE_DASHBOARD_PATH[role];
