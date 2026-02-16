'use client';

import { useEffect, useMemo } from 'react';

import { createBrowserClient } from '@/lib/supabase/client';
import { trpc } from '@/lib/trpc/client';

interface UseMessageUnreadCountResult {
  unreadCount: number;
  isLoading: boolean;
}

export const useMessageUnreadCount = (enabled: boolean): UseMessageUnreadCountResult => {
  const supabase = useMemo(() => createBrowserClient(), []);
  const utils = trpc.useUtils();
  const unreadQuery = trpc.chat.getUnreadCount.useQuery(undefined, {
    enabled,
    refetchInterval: 15_000
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const channel = supabase
      .channel('messages:unread-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        void Promise.all([
          utils.chat.getUnreadCount.invalidate(),
          utils.chat.getConversations.invalidate()
        ]);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, supabase, utils.chat.getConversations, utils.chat.getUnreadCount]);

  return {
    unreadCount: unreadQuery.data?.count ?? 0,
    isLoading: unreadQuery.isLoading
  };
};

