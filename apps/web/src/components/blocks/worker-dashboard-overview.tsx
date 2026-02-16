'use client';

import { formatCurrency } from '@yidak/utils';
import { motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

import type { GCCCountry } from '@yidak/types';

import { BadgeGrid } from '@/components/blocks/BadgeGrid';
import { BidCard } from '@/components/blocks/BidCard';
import { EmptyState } from '@/components/blocks/EmptyState';
import { StatCard } from '@/components/blocks/StatCard';
import { TierProgress } from '@/components/blocks/TierProgress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc/client';

interface WorkerDashboardOverviewProps {
  locale: 'en' | 'ar';
}

const toCountry = (value: string): GCCCountry => {
  if (value === 'SA' || value === 'QA' || value === 'BH' || value === 'KW' || value === 'OM') {
    return value;
  }

  return 'AE';
};

export const WorkerDashboardOverview = ({ locale }: WorkerDashboardOverviewProps): React.JSX.Element => {
  const t = useTranslations('worker.dashboard');
  const router = useRouter();
  const reducedMotion = useReducedMotion() ?? false;
  const statsQuery = trpc.user.getDashboardStats.useQuery();
  const profileQuery = trpc.user.getProfile.useQuery();
  const fallbackUuid = '00000000-0000-4000-8000-000000000000';
  const workerProfileQuery = trpc.user.getWorkerProfile.useQuery(
    { user_id: profileQuery.data?.id ?? fallbackUuid },
    { enabled: Boolean(profileQuery.data?.id) }
  );
  const bidsQuery = trpc.bid.getMyBids.useQuery(undefined, { refetchInterval: 8000 });
  const previousOutbidRef = useRef<ReadonlySet<string>>(new Set());

  const workerStats = useMemo(() => {
    const data = statsQuery.data;
    if (data?.role !== 'worker') {
      return null;
    }

    return data;
  }, [statsQuery.data]);

  const activeBids = useMemo(() => bidsQuery.data?.pending ?? [], [bidsQuery.data?.pending]);
  const wonAuctions = useMemo(() => bidsQuery.data?.accepted ?? [], [bidsQuery.data?.accepted]);
  const inProgress = useMemo(
    () => wonAuctions.filter((item) => item.job.status === 'assigned' || item.job.status === 'in_progress'),
    [wonAuctions]
  );

  const badgeItems = useMemo(() => {
    const workerProfile = workerProfileQuery.data?.worker_profile;
    const reviewCount = workerProfile?.total_reviews ?? 0;
    const totalJobs = workerProfile?.total_jobs ?? 0;
    const averageRating = workerProfile?.average_rating ?? 0;
    const responseMinutes = workerProfile?.response_time_minutes ?? 99;
    const portfolioCount = workerProfile?.portfolio_items.length ?? 0;
    const repeatCustomers = workerProfile?.repeat_customers ?? 0;

    return [
      {
        id: 'first-job',
        icon: 'job',
        title: t('badges.firstJob.title'),
        description: t('badges.firstJob.description'),
        progress: totalJobs,
        target: 1,
        earnedAt: totalJobs >= 1 ? new Date().toISOString().slice(0, 10) : null
      },
      {
        id: 'five-star-streak',
        icon: 'star',
        title: t('badges.fiveStarStreak.title'),
        description: t('badges.fiveStarStreak.description'),
        progress: Math.round(averageRating >= 5 ? 5 : averageRating),
        target: 5,
        earnedAt: averageRating >= 5 ? new Date().toISOString().slice(0, 10) : null
      },
      {
        id: 'speed-demon',
        icon: 'clock',
        title: t('badges.speedDemon.title'),
        description: t('badges.speedDemon.description'),
        progress: Math.min(3, Math.floor((workerProfile?.completion_rate ?? 0) / 35)),
        target: 3,
        earnedAt:
          (workerProfile?.completion_rate ?? 0) >= 95 ? new Date().toISOString().slice(0, 10) : null
      },
      {
        id: 'top-category',
        icon: 'trophy',
        title: t('badges.topCategory.title'),
        description: t('badges.topCategory.description'),
        progress: Math.round(averageRating),
        target: 5,
        earnedAt: averageRating >= 4.8 ? new Date().toISOString().slice(0, 10) : null
      },
      {
        id: 'century-club',
        icon: 'medal',
        title: t('badges.centuryClub.title'),
        description: t('badges.centuryClub.description'),
        progress: totalJobs,
        target: 100,
        earnedAt: totalJobs >= 100 ? new Date().toISOString().slice(0, 10) : null
      },
      {
        id: 'repeat-favorite',
        icon: 'repeat',
        title: t('badges.repeatFavorite.title'),
        description: t('badges.repeatFavorite.description'),
        progress: repeatCustomers,
        target: 10,
        earnedAt: repeatCustomers >= 10 ? new Date().toISOString().slice(0, 10) : null
      },
      {
        id: 'perfect-month',
        icon: 'award',
        title: t('badges.perfectMonth.title'),
        description: t('badges.perfectMonth.description'),
        progress: Math.round(averageRating >= 4.8 ? 1 : 0),
        target: 1,
        earnedAt: averageRating >= 4.8 && reviewCount >= 5 ? new Date().toISOString().slice(0, 10) : null
      },
      {
        id: 'portfolio-pro',
        icon: 'camera',
        title: t('badges.portfolioPro.title'),
        description: t('badges.portfolioPro.description'),
        progress: portfolioCount,
        target: 20,
        earnedAt: portfolioCount >= 20 ? new Date().toISOString().slice(0, 10) : null
      },
      {
        id: 'quick-responder',
        icon: 'chat',
        title: t('badges.quickResponder.title'),
        description: t('badges.quickResponder.description'),
        progress: Math.max(0, 5 - Math.round(responseMinutes / 5)),
        target: 5,
        earnedAt: responseMinutes <= 5 ? new Date().toISOString().slice(0, 10) : null
      },
      {
        id: 'multi-city',
        icon: 'city',
        title: t('badges.multiCity.title'),
        description: t('badges.multiCity.description'),
        progress: 1,
        target: 3,
        earnedAt: null
      }
    ] as const;
  }, [t, workerProfileQuery.data?.worker_profile]);

  useEffect(() => {
    const outbidItems = activeBids.flatMap((item) => {
      const lowestBid = item.job.lowest_bid;
      if (lowestBid === null || item.bid.amount <= lowestBid) {
        return [];
      }

      return [{ item, lowestBid }];
    });

    const nextKeys = new Set(outbidItems.map(({ item }) => item.bid.id));

    outbidItems.forEach(({ item, lowestBid }) => {
      if (previousOutbidRef.current.has(item.bid.id)) {
        return;
      }

      toast(t('outbid.message', {
        title: item.job.title,
        amount: formatCurrency(lowestBid, toCountry(item.job.country))
      }), {
        action: {
          label: t('outbid.action'),
          onClick: () => {
            router.push(`/${locale}/worker/jobs/${item.job.id}`);
          }
        }
      });
    });

    previousOutbidRef.current = nextKeys;
  }, [activeBids, locale, router, t]);

  if (statsQuery.isLoading || bidsQuery.isLoading || !workerStats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5"
      >
        <StatCard title={t('stats.totalEarnings')} value={workerStats.total_earnings} description={t('stats.totalEarningsHint')} />
        <StatCard title={t('stats.activeBids')} value={workerStats.active_bids} description={t('stats.activeBidsHint')} />
        <StatCard title={t('stats.jobsCompleted')} value={workerStats.jobs_completed} description={t('stats.jobsCompletedHint')} />
        <StatCard title={t('stats.rating')} value={workerStats.average_rating} description={t('stats.ratingHint')} />
        <StatCard title={t('stats.tierProgress')} value={workerStats.tier_progress} suffix="%" description={t('stats.tierProgressHint')} />
      </motion.div>

      {workerProfileQuery.data?.worker_profile ? (
        <TierProgress
          locale={locale}
          currentTier={workerProfileQuery.data.worker_profile.tier}
          totalJobs={workerProfileQuery.data.worker_profile.total_jobs}
        />
      ) : null}

      <BadgeGrid badges={badgeItems} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('sections.activeBids')}</h2>
        {activeBids.length === 0 ? (
          <EmptyState title={t('empty.active.title')} description={t('empty.active.description')} ctaLabel={t('empty.active.cta')} onCta={() => { router.push(`/${locale}/worker/jobs`); }} />
        ) : (
          activeBids.map((item) => (
            <div key={item.bid.id} className="space-y-2 rounded-2xl border border-border p-3">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <p className="truncate">{item.job.title}</p>
                <Badge variant="secondary">
                  {item.position ? t('position', { position: item.position }) : t('positionUnknown')}
                </Badge>
              </div>
              <BidCard
                bid={item.bid}
                rank={item.position ?? 1}
                isLowest={(item.position ?? 1) === 1}
                locale={locale}
                view="worker"
                onWithdraw={() => {
                  router.push(`/${locale}/worker/jobs/${item.job.id}`);
                }}
                labels={{
                  duration: t('bidCard.duration'),
                  status: t('bidCard.status'),
                  completionRate: t('bidCard.completionRate'),
                  acceptBid: t('bidCard.acceptBid'),
                  accepting: t('bidCard.accepting'),
                  withdraw: t('bidCard.revise'),
                  withdrawing: t('bidCard.withdrawing'),
                  showLess: t('bidCard.showLess'),
                  readMore: t('bidCard.readMore'),
                  lowest: t('bidCard.lowest')
                }}
              />
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('sections.wonAuctions')}</h2>
        {wonAuctions.length === 0 ? (
          <EmptyState title={t('empty.won.title')} description={t('empty.won.description')} ctaLabel={t('empty.won.cta')} onCta={() => { router.push(`/${locale}/worker/jobs`); }} />
        ) : (
          wonAuctions.map((item) => (
            <div key={item.bid.id} className="rounded-xl border border-border p-3 text-sm">
              <p className="font-medium">{item.job.title}</p>
              <p className="text-muted-foreground">{formatCurrency(item.bid.amount, toCountry(item.job.country))}</p>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('sections.inProgress')}</h2>
        {inProgress.length === 0 ? (
          <EmptyState title={t('empty.progress.title')} description={t('empty.progress.description')} ctaLabel={t('empty.progress.cta')} onCta={() => { router.push(`/${locale}/worker/active-jobs`); }} />
        ) : (
          inProgress.map((item) => (
            <div key={item.bid.id} className="rounded-xl border border-border p-3 text-sm">
              <p className="font-medium">{item.job.title}</p>
              <p className="text-muted-foreground">{item.job.city}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default WorkerDashboardOverview;
