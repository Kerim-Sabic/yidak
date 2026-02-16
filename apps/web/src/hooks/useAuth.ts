'use client';

import { useCallback, useEffect, useMemo } from 'react';

import type { ProfileRole, ProfileRow } from '@/lib/supabase/types';
import type { Session, User } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';

interface UseAuthResult {
  user: User | null;
  profile: ProfileRow | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: ProfileRole | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const loadProfile = async (userId: string): Promise<ProfileRow | null> => {
  const supabase = createClient();
  const { data, error } = await supabase.from('profiles').select('*').eq('auth_id', userId).single();

  if (error || !data) {
    return null;
  }

  return data;
};

export const useAuth = (): UseAuthResult => {
  const supabase = useMemo(() => createClient(), []);
  const { user, profile, session, isLoading, setUser, setProfile, setSession, setLoading, clearAuth } =
    useAuthStore();

  const hydrateFromSession = useCallback(
    async (nextSession: Session | null): Promise<void> => {
      if (!nextSession?.user) {
        clearAuth();
        return;
      }

      setSession(nextSession);
      setUser(nextSession.user);
      const loadedProfile = await loadProfile(nextSession.user.id);
      setProfile(loadedProfile);
      setLoading(false);
    },
    [clearAuth, setLoading, setProfile, setSession, setUser]
  );

  const refreshSession = useCallback(async (): Promise<void> => {
    setLoading(true);
    const {
      data: { session: nextSession }
    } = await supabase.auth.getSession();
    await hydrateFromSession(nextSession);
  }, [hydrateFromSession, setLoading, supabase.auth]);

  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
    clearAuth();
  }, [clearAuth, supabase.auth]);

  useEffect(() => {
    void refreshSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void hydrateFromSession(nextSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [hydrateFromSession, refreshSession, supabase.auth]);

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: Boolean(session?.user),
    role: profile?.role ?? null,
    signOut,
    refreshSession
  };
};
