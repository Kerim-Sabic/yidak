'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Archive, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import type { PanInfo } from 'framer-motion';

import { formatConversationTime } from '@/components/blocks/chat-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { createBrowserClient } from '@/lib/supabase/client';
import { trpc } from '@/lib/trpc/client';

interface ConversationListProps {
  locale: 'en' | 'ar';
  role: 'customer' | 'worker';
}

export const ConversationList = ({ locale, role }: ConversationListProps): React.JSX.Element => {
  const t = useTranslations('chatUi');
  const [search, setSearch] = useState('');
  const [archivedIds, setArchivedIds] = useState<ReadonlySet<string>>(new Set());
  const supabase = useMemo(() => createBrowserClient(), []);
  const utils = trpc.useUtils();

  const conversationsQuery = trpc.chat.getConversations.useQuery(undefined, {
    refetchOnWindowFocus: true
  });

  useEffect(() => {
    const channel = supabase
      .channel('messages:conversation-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        void Promise.all([
          utils.chat.getConversations.invalidate(),
          utils.chat.getUnreadCount.invalidate()
        ]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        void Promise.all([
          utils.chat.getConversations.invalidate(),
          utils.chat.getUnreadCount.invalidate()
        ]);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, utils.chat.getConversations, utils.chat.getUnreadCount]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const data = (conversationsQuery.data ?? []).filter((conversation) => !archivedIds.has(conversation.id));
    if (!query) {
      return data;
    }

    return data.filter((conversation) => {
      const name = conversation.other_party.full_name.toLowerCase();
      const preview = (conversation.last_message_preview ?? '').toLowerCase();
      return name.includes(query) || preview.includes(query);
    });
  }, [archivedIds, conversationsQuery.data, search]);

  if (conversationsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <Input
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
        }}
        placeholder={t('conversations.searchPlaceholder')}
        aria-label={t('conversations.searchPlaceholder')}
      />

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 text-sm font-medium">{t('conversations.emptyTitle')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('conversations.emptyDescription')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((conversation) => {
              const href =
                role === 'worker'
                  ? `/${locale}/worker/jobs/${conversation.job_id}/chat`
                  : `/${locale}/customer/jobs/${conversation.job_id}`;

              return (
                <div key={conversation.id} className="relative overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="pointer-events-auto"
                      onClick={() => {
                        setArchivedIds((previous) => new Set([...previous, conversation.id]));
                      }}
                      aria-label={t('conversations.archive')}
                    >
                      <Archive className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>

                  <motion.div
                    drag="x"
                    dragConstraints={{ left: -100, right: 0 }}
                    onDragEnd={(_event, info: PanInfo) => {
                      if (info.offset.x < -90) {
                        setArchivedIds((previous) => new Set([...previous, conversation.id]));
                      }
                    }}
                    className={`relative bg-card ${
                      conversation.unread_count > 0
                        ? 'border-s-4 border-primary'
                        : ''
                    }`}
                  >
                    <Link href={href} className="flex items-center gap-3 p-3">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={conversation.other_party.avatar_url ?? undefined} />
                        <AvatarFallback>
                          {conversation.other_party.full_name.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`truncate text-sm ${
                              conversation.unread_count > 0 ? 'font-semibold' : 'font-medium'
                            }`}
                          >
                            {conversation.other_party.full_name}
                          </p>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatConversationTime(conversation.last_message_at, locale)}
                          </span>
                        </div>
                        <p
                          className={`truncate text-xs ${
                            conversation.unread_count > 0
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {conversation.last_message_preview ?? t('conversations.noPreview')}
                        </p>
                      </div>

                      {conversation.unread_count > 0 ? (
                        <Badge
                          variant="destructive"
                          className="min-w-5 justify-center rounded-full px-1.5 text-[10px]"
                        >
                          {conversation.unread_count}
                        </Badge>
                      ) : null}
                    </Link>
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
};

export default ConversationList;

