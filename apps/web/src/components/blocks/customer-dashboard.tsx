'use client';

import { formatCurrency } from '@yidak/utils';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AirVent,
  Bug,
  Flame,
  Hammer,
  Lightbulb,
  Paintbrush,
  Sparkles,
  Wrench,
  type LucideIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { GCCCountry } from '@yidak/types';

import { EmptyState } from '@/components/blocks/EmptyState';
import { JobCard } from '@/components/blocks/JobCard';
import { StatCard } from '@/components/blocks/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc/client';

type DashboardTab = 'active' | 'completed' | 'cancelled';

const activeStatuses = new Set(['posted', 'bidding', 'assigned', 'in_progress']);
const completedStatuses = new Set(['completed', 'reviewed']);

const iconForCategory = (name: string): LucideIcon => {
  const normalized = name.toLowerCase();

  if (normalized.includes('elect')) return Lightbulb;
  if (normalized.includes('ac')) return AirVent;
  if (normalized.includes('paint')) return Paintbrush;
  if (normalized.includes('clean')) return Sparkles;
  if (normalized.includes('pest')) return Bug;
  if (normalized.includes('weld')) return Flame;
  if (normalized.includes('carp') || normalized.includes('handyman')) return Hammer;

  return Wrench;
};

const readRoleStats = (value: unknown): { total_spent: number; average_savings: number } => {
  if (!value || typeof value !== 'object') {
    return { total_spent: 0, average_savings: 0 };
  }

  const totalSpentValue = Reflect.get(value, 'total_spent');
  const averageSavingsValue = Reflect.get(value, 'average_savings');

  return {
    total_spent: typeof totalSpentValue === 'number' ? totalSpentValue : 0,
    average_savings: typeof averageSavingsValue === 'number' ? averageSavingsValue : 0
  };
};

const toCountryCode = (value: string): GCCCountry => {
  if (value === 'SA' || value === 'QA' || value === 'BH' || value === 'KW' || value === 'OM') {
    return value;
  }

  return 'AE';
};

export const CustomerDashboard = ({ locale }: { locale: 'en' | 'ar' }): React.JSX.Element => {
  const t = useTranslations('customer.dashboard');
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [tab, setTab] = useState<DashboardTab>('active');
  const [visibleCount, setVisibleCount] = useState(8);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const jobsQuery = trpc.job.listByCustomer.useQuery();
  const statsQuery = trpc.user.getDashboardStats.useQuery();

  const jobs = useMemo(() => jobsQuery.data ?? [], [jobsQuery.data]);
  const completedCount = jobs.filter((job) => completedStatuses.has(job.status)).length;

  const filteredJobs = useMemo(() => {
    if (tab === 'active') return jobs.filter((job) => activeStatuses.has(job.status));
    if (tab === 'completed') return jobs.filter((job) => completedStatuses.has(job.status));
    return jobs.filter((job) => !activeStatuses.has(job.status) && !completedStatuses.has(job.status));
  }, [jobs, tab]);

  useEffect(() => {
    setVisibleCount(8);
  }, [tab]);

  const visibleJobs = filteredJobs.slice(0, visibleCount);

  const stats = readRoleStats(statsQuery.data);
  const activeCount = jobs.filter((job) => activeStatuses.has(job.status)).length;

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element || visibleCount >= filteredJobs.length) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry?.isIntersecting) {
        return;
      }

      setVisibleCount((previous) => previous + 6);
    });

    observer.observe(element);
    return () => { observer.disconnect(); };
  }, [filteredJobs.length, visibleCount]);

  if (jobsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 80 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 70) {
          void Promise.all([jobsQuery.refetch(), statsQuery.refetch()]);
        }
      }}
      className="space-y-5"
    >
      <motion.div
        initial={reducedMotion ? false : 'hidden'}
        animate="show"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard title={t('stats.activeJobs')} value={activeCount} description={t('stats.activeJobsHint')} />
        <StatCard title={t('stats.totalSpent')} value={stats.total_spent} description={t('stats.totalSpentHint')} />
        <StatCard title={t('stats.averageSavings')} value={stats.average_savings} suffix="%" description={t('stats.averageSavingsHint')} />
        <StatCard title={t('stats.jobsCompleted')} value={completedCount} description={t('stats.jobsCompletedHint')} />
      </motion.div>

      <Tabs value={tab} onValueChange={(value) => { setTab((value === 'active' || value === 'completed' || value === 'cancelled') ? value : 'active'); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">{t('tabs.active')}</TabsTrigger>
          <TabsTrigger value="completed">{t('tabs.completed')}</TabsTrigger>
          <TabsTrigger value="cancelled">{t('tabs.cancelled')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredJobs.length === 0 ? (
        <EmptyState
          title={t('empty.title')}
          description={t('empty.description')}
          ctaLabel={t('empty.cta')}
          onCta={() => { router.push(`/${locale}/customer/jobs/new`); }}
        />
      ) : (
        <div className="space-y-3">
          {visibleJobs.map((job) => {
            const categoryName = job.category?.name_en ?? t('fallback.category');
            const categoryIcon = iconForCategory(categoryName);
            const country = toCountryCode(job.country);

            return (
              <JobCard
                key={job.id}
                href={`/${locale}/customer/jobs/${job.id}`}
                locale={locale}
                title={job.title}
                status={job.status}
                categoryName={categoryName}
                categoryIcon={categoryIcon}
                budgetLabel={`${formatCurrency(job.budget_min, country)} - ${formatCurrency(job.budget_max, country)}`}
                bidCount={job.bid_count}
                lowestBidLabel={job.lowest_bid ? formatCurrency(job.lowest_bid, country) : null}
                createdAt={job.created_at}
                expiresAt={job.expires_at}
                country={country}
                labels={{
                  bids: t('card.bids'),
                  lowestBid: t('card.lowestBid'),
                  posted: t('card.posted'),
                  timeRemaining: t('card.timeRemaining'),
                  expired: t('card.expired')
                }}
              />
            );
          })}

          <div ref={sentinelRef} className="h-4" />
        </div>
      )}
    </motion.div>
  );
};

export default CustomerDashboard;
