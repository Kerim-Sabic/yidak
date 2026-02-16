'use client';

import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import { JobIdSchema } from '@yidak/types';
import { LayoutGroup, AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { AuctionTimer } from '@/components/blocks/AuctionTimer';
import { BidCard } from '@/components/blocks/BidCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { createBrowserClient } from '@/lib/supabase/client';
import { trpc } from '@/lib/trpc/client';

interface JobBidsPanelProps {
  locale: 'en' | 'ar';
  jobId: string;
}

const fallbackJobId = JobIdSchema.parse('00000000-0000-4000-8000-000000000000');

const getTimerExtendedExpiry = (value: unknown): string | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const rawPayload = Reflect.get(value, 'payload');
  if (typeof rawPayload !== 'object' || rawPayload === null) {
    return null;
  }

  const rawExpiry = Reflect.get(rawPayload, 'new_expires_at');
  return typeof rawExpiry === 'string' ? rawExpiry : null;
};

export const JobBidsPanel = ({ locale, jobId }: JobBidsPanelProps): React.JSX.Element => {
  const t = useTranslations('customer.jobs.detail');
  const reducedMotion = useReducedMotion() ?? false;
  const supabase = useMemo(() => createBrowserClient(), []);
  const { user } = useAuth();
  const parsedJob = JobIdSchema.safeParse(jobId);
  const utils = trpc.useUtils();
  const [viewerCount, setViewerCount] = useState(0);
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);
  const [dialogBidId, setDialogBidId] = useState<string | null>(null);
  const [liveExpiresAt, setLiveExpiresAt] = useState<string | null>(null);
  const previousLowestRef = useRef<number | null>(null);

  const resolvedJobId = parsedJob.success ? parsedJob.data : fallbackJobId;

  const bidsQuery = trpc.bid.listForJob.useQuery(resolvedJobId, {
    enabled: parsedJob.success
  });

  const jobQuery = trpc.job.getById.useQuery(resolvedJobId, {
    enabled: parsedJob.success
  });

  const acceptBid = trpc.bid.accept.useMutation({
    onMutate: (payload) => {
      setAcceptingBidId(payload.bid_id);
    },
    onSuccess: async () => {
      await Promise.all([
        utils.bid.listForJob.invalidate(resolvedJobId),
        utils.job.getById.invalidate(resolvedJobId)
      ]);
      setDialogBidId(null);
      toast.success(t('accept.success'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      setAcceptingBidId(null);
    }
  });

  useEffect(() => {
    if (!parsedJob.success) {
      return;
    }

    const bidsChannel = supabase
      .channel(`job-bids:${jobId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bids', filter: `job_id=eq.${jobId}` },
        () => {
          void utils.bid.listForJob.invalidate(resolvedJobId);
        }
      )
      .on('broadcast', { event: 'bid_accepted' }, () => {
        void Promise.all([
          utils.bid.listForJob.invalidate(resolvedJobId),
          utils.job.getById.invalidate(resolvedJobId)
        ]);
      });

    const timerChannel = supabase
      .channel(`job-timer:${jobId}`)
      .on('broadcast', { event: 'timer_extended' }, (payload) => {
        const nextExpiry = getTimerExtendedExpiry(payload);

        if (typeof nextExpiry === 'string') {
          setLiveExpiresAt(nextExpiry);
          toast.message(t('timerExtended'));
          void utils.job.getById.invalidate(resolvedJobId);
        }
      });

    const presenceChannel = supabase.channel(`job-presence:${jobId}`);
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setViewerCount(Object.keys(state).length);
      })
      .subscribe((status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          void presenceChannel.track({
            user_id: user?.id ?? 'anonymous',
            role: 'viewer',
            at: new Date().toISOString()
          });
        }
      });

    void bidsChannel.subscribe();
    void timerChannel.subscribe();

    return () => {
      void supabase.removeChannel(bidsChannel);
      void supabase.removeChannel(timerChannel);
      void supabase.removeChannel(presenceChannel);
    };
  }, [jobId, parsedJob.success, resolvedJobId, supabase, t, user?.id, utils.bid.listForJob, utils.job.getById]);

  const bids = useMemo(() => bidsQuery.data ?? [], [bidsQuery.data]);

  useEffect(() => {
    const currentLowest = bids.length > 0 ? bids[0]?.amount ?? null : null;
    if (currentLowest === null) {
      return;
    }

    if (previousLowestRef.current === null) {
      previousLowestRef.current = currentLowest;
      return;
    }

    if (currentLowest < previousLowestRef.current) {
      previousLowestRef.current = currentLowest;
    }
  }, [bids]);

  const selectedBid = useMemo(
    () => bids.find((bid) => bid.id === dialogBidId) ?? null,
    [bids, dialogBidId]
  );

  if (!parsedJob.success) {
    return <p className="text-sm text-destructive">{t('invalidJobId')}</p>;
  }

  if (bidsQuery.isLoading || jobQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/35 p-3">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative inline-flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
          </span>
          <Users className="h-3.5 w-3.5" aria-hidden />
          {t('viewerCount', { count: viewerCount })}
        </div>

        {jobQuery.data?.job.expires_at || liveExpiresAt ? (
          <AuctionTimer
            expiresAt={liveExpiresAt ?? jobQuery.data?.job.expires_at ?? new Date().toISOString()}
            expiredLabel={t('timerExpired')}
          />
        ) : null}
      </div>

      {bids.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noBidsYet')}</p>
      ) : (
        <div aria-live="polite" aria-atomic={false}>
          <LayoutGroup>
            <AnimatePresence mode="popLayout" initial={false}>
              {bids.map((bid, index) => (
                <motion.div
                  key={bid.id}
                  layout
                  initial={reducedMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.03 }}
                >
                  <BidCard
                    bid={bid}
                    rank={index + 1}
                    locale={locale}
                    view="customer"
                    isLowest={index === 0}
                    previousLowestAmount={previousLowestRef.current}
                    isAccepting={acceptingBidId === bid.id}
                    onAccept={() => {
                      setDialogBidId(bid.id);
                    }}
                    labels={{
                      duration: t('bidCard.duration'),
                      status: t('bidCard.status'),
                      completionRate: t('bidCard.completionRate'),
                      acceptBid: t('bidCard.acceptBid'),
                      accepting: t('bidCard.accepting'),
                      withdraw: t('bidCard.withdraw'),
                      withdrawing: t('bidCard.withdrawing'),
                      showLess: t('bidCard.showLess'),
                      readMore: t('bidCard.readMore'),
                      lowest: t('bidCard.lowest')
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </LayoutGroup>
        </div>
      )}

      <Dialog open={!!dialogBidId} onOpenChange={(open) => { if (!open) { setDialogBidId(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('accept.title')}</DialogTitle>
            <DialogDescription>{t('accept.description')}</DialogDescription>
          </DialogHeader>

          {selectedBid ? (
            <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3 text-sm">
              <p>
                <span className="text-muted-foreground">{t('accept.worker')}:</span>{' '}
                {selectedBid.worker?.full_name ?? t('accept.unknownWorker')}
              </p>
              <p>
                <span className="text-muted-foreground">{t('accept.amount')}:</span>{' '}
                {new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en', {
                  style: 'currency',
                  currency: selectedBid.currency
                }).format(selectedBid.amount)}
              </p>
              <p className="text-xs text-muted-foreground">{t('accept.escrowNote')}</p>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setDialogBidId(null); }}>
              {t('accept.cancel')}
            </Button>
            <Button
              type="button"
              disabled={!selectedBid || acceptBid.isPending}
              onClick={() => {
                if (!selectedBid) {
                  return;
                }

                void acceptBid.mutateAsync({ bid_id: selectedBid.id });
              }}
            >
              {acceptBid.isPending ? t('accept.confirming') : t('accept.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default JobBidsPanel;
