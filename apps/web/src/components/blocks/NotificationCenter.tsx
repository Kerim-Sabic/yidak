'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Bell,
  BellRing,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  Gift,
  MessageSquare,
  ShieldCheck,
  Star,
  Trophy
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { PanInfo } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { createBrowserClient } from '@/lib/supabase/client';
import { trpc } from '@/lib/trpc/client';

interface NotificationCenterProps {
  mode?: 'trigger' | 'page';
  className?: string;
}

interface NotificationListItem {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface TypeStyle {
  icon: LucideIcon;
  className: string;
}

const typeStyles: Readonly<Record<string, TypeStyle>> = {
  new_bid: { icon: DollarSign, className: 'bg-teal-500/15 text-teal-600' },
  bid_accepted: { icon: CheckCircle2, className: 'bg-emerald-500/15 text-emerald-600' },
  outbid: { icon: BellRing, className: 'bg-amber-500/15 text-amber-600' },
  job_posted: { icon: ShieldCheck, className: 'bg-sky-500/15 text-sky-600' },
  message_received: { icon: MessageSquare, className: 'bg-primary/15 text-primary' },
  payment_authorized: { icon: CreditCard, className: 'bg-indigo-500/15 text-indigo-600' },
  payment_released: { icon: DollarSign, className: 'bg-emerald-500/15 text-emerald-600' },
  review_received: { icon: Star, className: 'bg-amber-500/15 text-amber-600' },
  job_completed: { icon: CheckCircle2, className: 'bg-emerald-500/15 text-emerald-600' },
  auction_ending: { icon: Clock3, className: 'bg-destructive/15 text-destructive' },
  tier_upgrade: { icon: Trophy, className: 'bg-amber-500/15 text-amber-600' },
  referral_credit: { icon: Gift, className: 'bg-fuchsia-500/15 text-fuchsia-600' }
};

const defaultStyle: TypeStyle = {
  icon: Bell,
  className: 'bg-muted text-muted-foreground'
};

const relativeTime = (value: string, locale: 'en' | 'ar'): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (Math.abs(seconds) < 60) {
    return formatter.format(seconds, 'second');
  }

  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, 'minute');
  }

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return formatter.format(hours, 'hour');
  }

  const days = Math.round(hours / 24);
  return formatter.format(days, 'day');
};

const uniqueItems = (items: ReadonlyArray<NotificationListItem>): ReadonlyArray<NotificationListItem> => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
};

const NotificationSkeleton = (): React.JSX.Element => (
  <div className="space-y-3 p-1">
    <Skeleton className="h-16" />
    <Skeleton className="h-16" />
    <Skeleton className="h-16" />
  </div>
);

const resolveLocale = (pathname: string): 'en' | 'ar' => {
  const segment = pathname.split('/').find((part) => part.length > 0);
  return segment === 'ar' ? 'ar' : 'en';
};

const resolveNotificationsPath = (locale: 'en' | 'ar', role: string | null): string => {
  if (role === 'worker') {
    return `/${locale}/worker/notifications`;
  }

  if (role === 'admin') {
    return `/${locale}/admin/notifications`;
  }

  return `/${locale}/notifications`;
};

const NotificationList = ({
  locale,
  items,
  unreadCount,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  compact
}: {
  locale: 'en' | 'ar';
  items: ReadonlyArray<NotificationListItem>;
  unreadCount: number;
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onFetchNextPage: () => void;
  onMarkRead: (notificationId: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (notificationId: string) => void;
  compact: boolean;
}): React.JSX.Element => {
  const t = useTranslations('notificationsCenter');
  const reducedMotion = useReducedMotion() ?? false;
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !observerRef.current) {
      return;
    }

    const element = observerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onFetchNextPage();
        }
      },
      { rootMargin: '120px' }
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, onFetchNextPage]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{t('title')}</p>
        <div className="flex items-center gap-2">
          {unreadCount > 0 ? (
            <Badge variant="secondary" className="text-xs">
              {t('unreadCount', { count: unreadCount })}
            </Badge>
          ) : null}
          <Button type="button" size="sm" variant="ghost" onClick={onMarkAllRead}>
            {t('markAllRead')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <NotificationSkeleton />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
          <p className="text-sm font-medium">{t('emptyTitle')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('emptyBody')}</p>
        </div>
      ) : (
        <ScrollArea className={compact ? 'h-[23rem]' : 'h-[70dvh]'} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          <div className="space-y-2 pe-2">
            <AnimatePresence initial={false}>
              {items.map((item) => {
                const style = typeStyles[item.type] ?? defaultStyle;
                const Icon = style.icon;
                return (
                  <motion.article
                    key={item.id}
                    layout
                    {...(reducedMotion
                      ? {}
                      : {
                          initial: { opacity: 0, y: 10 },
                          animate: { opacity: 1, y: 0 },
                          exit: { opacity: 0, y: -8 }
                        })}
                    transition={{ type: 'spring', stiffness: 160, damping: 20 }}
                    drag="x"
                    dragConstraints={{ left: -120, right: 120 }}
                    onDragEnd={(_event, info: PanInfo) => {
                      if (Math.abs(info.offset.x) > 90) {
                        onDismiss(item.id);
                      }
                    }}
                    className={`rounded-xl border p-3 ${item.is_read ? 'bg-card' : 'bg-primary/5'}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onMarkRead(item.id);
                      }}
                      className="w-full text-start"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.className}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold">{item.title}</p>
                            {!item.is_read ? (
                              <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {relativeTime(item.created_at, locale)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </motion.article>
                );
              })}
            </AnimatePresence>

            <div ref={observerRef} className="h-5" />
            {isFetchingNextPage ? <NotificationSkeleton /> : null}
          </div>
        </ScrollArea>
      )}

    </div>
  );
};

export const NotificationCenter = ({
  mode = 'trigger',
  className
}: NotificationCenterProps): React.JSX.Element => {
  const t = useTranslations('notificationsCenter');
  const reducedMotion = useReducedMotion() ?? false;
  const pathname = usePathname();
  const locale = resolveLocale(pathname);
  const { role, profile } = useAuth();
  const utils = trpc.useUtils();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const listQuery = trpc.notification.list.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined
    }
  );
  const unreadQuery = trpc.notification.getUnreadCount.useQuery();
  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => {
      void Promise.all([utils.notification.list.invalidate(), utils.notification.getUnreadCount.invalidate()]);
    }
  });
  const dismiss = trpc.notification.dismiss.useMutation({
    onSuccess: () => {
      void Promise.all([utils.notification.list.invalidate(), utils.notification.getUnreadCount.invalidate()]);
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const sync = (): void => {
      setIsMobile(mediaQuery.matches);
    };
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => {
      mediaQuery.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    if (!profile?.id) {
      return;
    }

    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        () => {
          void Promise.all([
            utils.notification.list.invalidate(),
            utils.notification.getUnreadCount.invalidate()
          ]);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profile?.id, supabase, utils.notification.getUnreadCount, utils.notification.list]);

  const notifications = useMemo(() => {
    const pages = listQuery.data?.pages ?? [];
    const flattened = pages.flatMap((page) =>
      page.items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        body: item.body,
        is_read: item.is_read,
        created_at: item.created_at
      }))
    );

    return uniqueItems(flattened);
  }, [listQuery.data?.pages]);

  const unreadCount = unreadQuery.data?.unread_count ?? 0;
  const navigationPath = resolveNotificationsPath(locale, role);

  const handleMarkRead = useCallback(
    (notificationId: string): void => {
      void markRead.mutateAsync({ notification_id: notificationId });
    },
    [markRead]
  );

  const handleMarkAllRead = useCallback((): void => {
    void markRead.mutateAsync({ all: true });
  }, [markRead]);

  const handleDismiss = useCallback(
    (notificationId: string): void => {
      void dismiss.mutateAsync({ notification_id: notificationId });
    },
    [dismiss]
  );

  const listContent = (
    <NotificationList
      locale={locale}
      items={notifications}
      unreadCount={unreadCount}
      isLoading={listQuery.isLoading}
      hasNextPage={listQuery.hasNextPage}
      isFetchingNextPage={listQuery.isFetchingNextPage}
      onFetchNextPage={() => {
        void listQuery.fetchNextPage();
      }}
      onMarkRead={handleMarkRead}
      onMarkAllRead={handleMarkAllRead}
      onDismiss={handleDismiss}
      compact={mode === 'trigger'}
    />
  );

  if (mode === 'page') {
    return <div className={className}>{listContent}</div>;
  }

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button type="button" variant="ghost" size="icon" aria-label={t('title')}>
            <span className="relative">
              <Bell className="h-5 w-5" />
              <AnimatePresence>
                {unreadCount > 0 ? (
                  <motion.span
                    key={`unread-mobile-${unreadCount}`}
                    {...(reducedMotion
                      ? {}
                      : {
                          initial: { scale: 0.6, opacity: 0 },
                          animate: { scale: 1, opacity: 1 },
                          exit: { scale: 0.6, opacity: 0 }
                        })}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    className="absolute -end-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground"
                  >
                    {Math.min(99, unreadCount)}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[78dvh] sm:max-w-none">
          <SheetHeader>
            <SheetTitle>{t('title')}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 h-[calc(78dvh-4.5rem)]">
            {listContent}
            <div className="mt-3">
              <Button asChild variant="outline" className="w-full">
                <Link href={navigationPath}>{t('viewAll')}</Link>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={t('title')} className={className}>
          <span className="relative">
            <Bell className="h-5 w-5" />
            <AnimatePresence>
              {unreadCount > 0 ? (
                <motion.span
                  key={`unread-desktop-${unreadCount}`}
                  {...(reducedMotion
                    ? {}
                    : {
                        initial: { scale: 0.6, opacity: 0 },
                        animate: { scale: 1, opacity: 1 },
                        exit: { scale: 0.6, opacity: 0 }
                      })}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  className="absolute -end-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground"
                >
                  {Math.min(99, unreadCount)}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[28rem] p-3">
        {listContent}
        <div className="mt-3">
          <Button asChild variant="outline" className="w-full">
            <Link href={navigationPath}>{t('viewAll')}</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
