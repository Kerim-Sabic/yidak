'use client';

import { create } from 'zustand';

import type { ProfileRow } from '@/lib/supabase/types';
import type { Session, User } from '@supabase/supabase-js';

interface AuthStoreState {
  user: User | null;
  profile: ProfileRow | null;
  session: Session | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: ProfileRow | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  setUser: (user) => {
    set({ user });
  },
  setProfile: (profile) => {
    set({ profile });
  },
  setSession: (session) => {
    set({ session });
  },
  setLoading: (isLoading) => {
    set({ isLoading });
  },
  clearAuth: () => {
    set({ user: null, profile: null, session: null, isLoading: false });
  }
}));
