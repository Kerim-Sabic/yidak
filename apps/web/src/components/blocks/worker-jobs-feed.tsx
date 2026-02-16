'use client';

import { formatCurrency } from '@yidak/utils';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { BellRing, ChevronRight, Filter, Star } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import type { GCCCountry } from '@yidak/types';

import { AuctionTimer } from '@/components/blocks/AuctionTimer';
import { JOB_CATEGORIES } from '@/components/blocks/job-posting/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { createBrowserClient } from '@/lib/supabase/client';
import { trpc } from '@/lib/trpc/client';

interface WorkerJobsFeedProps {
  locale: 'en' | 'ar';
}

type SortOption = 'newest' | 'highest_budget' | 'ending_soon';

const toCountry = (value: string): GCCCountry => {
  if (value === 'SA' || value === 'QA' || value === 'BH' || value === 'KW' || value === 'OM') {
    return value;
  }

  return 'AE';
};

const readPayloadValue = (payload: unknown, key: string): unknown => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return Reflect.get(payload, key);
};

export const WorkerJobsFeed = ({ locale }: WorkerJobsFeedProps): React.JSX.Element => {
  const t = useTranslations('worker.jobs.feed');
  const reducedMotion = useReducedMotion() ?? false;
  const utils = trpc.useUtils();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [categoryId, setCategoryId] = useState<string>('all');
  const [distanceKm, setDistanceKm] = useState(25);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [highlightedIds, setHighlightedIds] = useState<ReadonlySet<string>>(new Set());

  const queryInput = useMemo(
    () => ({
      category_id: categoryId === 'all' ? undefined : categoryId,
      distance_km: distanceKm,
      sort_by: sortBy,
      limit: 20
    }),
    [categoryId, distanceKm, sortBy]
  );

  const jobsQuery = trpc.job.listAvailable.useQuery(queryInput, {
    refetchInterval: 30_000
  });

  useEffect(() => {
    const channel = supabase
      .channel('worker-job-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, (payload) => {
        const nextRecord = readPayloadValue(payload, 'new');
        const status = typeof readPayloadValue(nextRecord, 'status') === 'string'
          ? String(readPayloadValue(nextRecord, 'status'))
          : '';

        if (status !== 'posted' && status !== 'bidding') {
          return;
        }

        const nextId = readPayloadValue(nextRecord, 'id');
        if (typeof nextId === 'string') {
          setHighlightedIds((previous) => {
            const copied = new Set(previous);
            copied.add(nextId);
            return copied;
          });

          window.setTimeout(() => {
            setHighlightedIds((previous) => {
              const copied = new Set(previous);
              copied.delete(nextId);
              return copied;
            });
          }, 2400);
        }

        void utils.job.listAvailable.invalidate(queryInput);
      });

    void channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryInput, supabase, utils.job.listAvailable]);

  if (jobsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  const jobs = jobsQuery.data ?? [];

  return (
    <section className="space-y-4">
      <div className="sticky top-0 z-10 rounded-xl border border-border bg-background/95 p-3 backdrop-blur">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Filter className="h-3.5 w-3.5" aria-hidden />
          {t('filters.title')}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder={t('filters.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allCategories')}</SelectItem>
              {JOB_CATEGORIES.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {t(`categories.${category.slug}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-2 rounded-lg border border-border p-2">
            <p className="text-xs text-muted-foreground">
              {t('filters.distance')}: {distanceKm} km
            </p>
            <Slider
              min={5}
              max={50}
              step={1}
              value={[distanceKm]}
              onValueChange={(value) => {
                const next = value[0];
                if (typeof next === 'number') {
                  setDistanceKm(next);
                }
              }}
            />
          </div>

          <Select value={sortBy} onValueChange={(value) => {
            if (value === 'newest' || value === 'highest_budget' || value === 'ending_soon') {
              setSortBy(value);
            }
          }}>
            <SelectTrigger>
              <SelectValue placeholder={t('filters.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t('filters.sortNewest')}</SelectItem>
              <SelectItem value="highest_budget">{t('filters.sortHighestBudget')}</SelectItem>
              <SelectItem value="ending_soon">{t('filters.sortEndingSoon')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t('empty')}
        </div>
      ) : (
        <LayoutGroup>
          <AnimatePresence mode="popLayout" initial={false}>
            {jobs.map((job) => {
              const highlighted = highlightedIds.has(job.id);
              const country = toCountry(job.country);

              return (
                <motion.div
                  key={job.id}
                  layout
                  initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  <Card className={highlighted ? 'border-primary shadow-[0_0_0_1px_rgba(20,184,166,0.35)]' : ''}>
                    <CardContent className="space-y-3 p-4">
                      {highlighted ? (
                        <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                          <BellRing className="h-3.5 w-3.5" aria-hidden />
                          {t('newJob')}
                        </div>
                      ) : null}

                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">{job.category?.name_en ?? t('unknownCategory')}</p>
                          <h3 className="text-base font-semibold text-foreground">{job.title}</h3>
                        </div>
                        <Badge variant="secondary" className="capitalize">
                          {job.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-4">
                        <p>{formatCurrency(job.budget_min, country)} - {formatCurrency(job.budget_max, country)}</p>
                        <p>{t('distance', { value: job.distance_km.toFixed(1) })}</p>
                        <p>{t('bidCount', { count: job.bid_count })}</p>
                        <p className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                          {(job.customer_rating ?? 0).toFixed(1)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        {job.expires_at ? <AuctionTimer expiresAt={job.expires_at} expiredLabel={t('ended')} /> : <span />}
                        <Button asChild>
                          <Link href={`/${locale}/worker/jobs/${job.id}`}>
                            {t('placeBid')}
                            <ChevronRight className="ms-1 h-4 w-4" aria-hidden />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </LayoutGroup>
      )}
    </section>
  );
};

export default WorkerJobsFeed;
