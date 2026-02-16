'use client';

import { JobIdSchema } from '@yidak/types';
import { formatCurrency } from '@yidak/utils';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { BidCard } from '@/components/blocks/BidCard';
import { JobReviewSection } from '@/components/blocks/job-review-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc/client';

interface WorkerJobDetailProps {
  locale: 'en' | 'ar';
  jobId: string;
}

const fallbackJobId = JobIdSchema.parse('00000000-0000-4000-8000-000000000000');

const toCountry = (value: string): 'AE' | 'SA' | 'QA' | 'BH' | 'KW' | 'OM' => {
  if (value === 'SA' || value === 'QA' || value === 'BH' || value === 'KW' || value === 'OM') {
    return value;
  }

  return 'AE';
};

const parsePoint = (raw: string): { latitude: number; longitude: number } | null => {
  const match = /POINT\\((-?\\d+(?:\\.\\d+)?)\\s+(-?\\d+(?:\\.\\d+)?)\\)/.exec(raw);
  if (!match) {
    return null;
  }

  const longitude = Number(match[1]);
  const latitude = Number(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

const mapSrc = (latitude: number, longitude: number): string =>
  `https://maps.google.com/maps?q=${latitude},${longitude}&z=13&output=embed`;

export const WorkerJobDetail = ({ locale, jobId }: WorkerJobDetailProps): React.JSX.Element => {
  const t = useTranslations('worker.jobDetail');
  const reducedMotion = useReducedMotion() ?? false;
  const { profile } = useAuth();
  const utils = trpc.useUtils();
  const parsed = JobIdSchema.safeParse(jobId);

  const [amount, setAmount] = useState(150);
  const [message, setMessage] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('2');
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const resolvedJobId = parsed.success ? parsed.data : fallbackJobId;

  const jobQuery = trpc.job.getById.useQuery(resolvedJobId, {
    enabled: parsed.success
  });

  const bidsQuery = trpc.bid.listForJob.useQuery(resolvedJobId, {
    enabled: parsed.success
  });

  const withdrawBid = trpc.bid.withdraw.useMutation({
    onSuccess: async () => {
      await utils.bid.listForJob.invalidate(resolvedJobId);
      toast.success(t('withdrawSuccess'));
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const placeBid = trpc.bid.place.useMutation({
    onMutate: async (newBid) => {
      await utils.bid.listForJob.cancel(resolvedJobId);
      const previousBids = utils.bid.listForJob.getData(resolvedJobId);

      const optimisticBid = {
        id: `optimistic-${crypto.randomUUID()}`,
        job_id: resolvedJobId,
        worker_id: profile?.id ?? fallbackJobId,
        amount: newBid.amount,
        currency: 'AED',
        status: 'pending',
        message: newBid.message ?? null,
        estimated_duration_hours: newBid.estimated_duration_hours,
        created_at: new Date().toISOString(),
        worker: profile
          ? {
              id: profile.id,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              is_verified: profile.is_verified,
              tier: 'bronze' as const,
              average_rating: null,
              completion_rate: null,
              response_time_minutes: null,
              total_reviews: 0,
              distance_km: null
            }
          : null
      };

      utils.bid.listForJob.setData(resolvedJobId, (old) => {
        const current = old ?? [];
        return [optimisticBid, ...current].sort((left, right) => left.amount - right.amount);
      });

      return { previousBids };
    },
    onError: (error, _vars, context) => {
      utils.bid.listForJob.setData(resolvedJobId, context?.previousBids);
      setSubmitState('error');
      toast.error(error.message);
    },
    onSuccess: async () => {
      setSubmitState('success');
      setMessage('');
      await utils.bid.listForJob.invalidate(resolvedJobId);
      toast.success(t('placeSuccess'));
      window.setTimeout(() => {
        setSubmitState('idle');
      }, 1000);
    },
    onSettled: async () => {
      await utils.bid.listForJob.invalidate(resolvedJobId);
    }
  });

  useEffect(() => {
    const job = jobQuery.data?.job;
    if (!job) {
      return;
    }

    const suggested = job.lowest_bid ? Math.max(1, job.lowest_bid - 10) : job.budget_max;
    setAmount(Math.floor(suggested));
  }, [jobQuery.data?.job]);

  if (!parsed.success) {
    return <p className="text-sm text-destructive">{t('invalidJob')}</p>;
  }

  if (jobQuery.isLoading || bidsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!jobQuery.data) {
    return <p className="text-sm text-muted-foreground">{t('notFound')}</p>;
  }

  const job = jobQuery.data.job;
  const country = toCountry(job.country);
  const suggestedMin = job.lowest_bid ? Math.max(1, Math.floor(job.lowest_bid - 50)) : Math.floor(job.budget_min);
  const suggestedMax = job.lowest_bid ? Math.max(suggestedMin, Math.floor(job.lowest_bid - 10)) : Math.floor(job.budget_max);
  const savings = Math.max(0, ((job.budget_max - amount) / Math.max(1, job.budget_max)) * 100);
  const point = parsePoint(job.location);

  return (
    <div className="space-y-5">
      <header className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">{job.category?.name_en ?? t('unknownCategory')}</p>
        <h1 className="text-xl font-semibold">{job.title}</h1>
        <p className="text-sm text-muted-foreground">{job.description}</p>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" aria-hidden />
          {job.address}
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
          <p className="text-xs text-muted-foreground">{t('customerLabel')}</p>
          <p className="font-medium text-foreground">{job.customer?.name ?? t('unknownCustomer')}</p>
        </div>

        <Button asChild type="button" variant="outline" size="sm" className="w-fit">
          <Link href={`/${locale}/worker/jobs/${job.id}/chat`}>{t('openChat')}</Link>
        </Button>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {job.photos.map((photo) => (
          <img key={photo} src={photo} alt={t('photoAlt')} className="h-36 w-full rounded-xl object-cover" />
        ))}
      </section>

      {point ? (
        <section className="rounded-2xl border border-border bg-card p-3">
          <iframe
            title={t('mapTitle')}
            src={mapSrc(point.latitude, point.longitude)}
            className="h-52 w-full rounded-xl border-0"
            loading="lazy"
          />
        </section>
      ) : null}

      <motion.section
        animate={submitState === 'error' && !reducedMotion ? { x: [0, -8, 8, -6, 6, 0] } : {}}
        transition={{ duration: 0.45 }}
        className="space-y-4 rounded-2xl border border-border bg-card p-4"
      >
        <h2 className="text-lg font-semibold">{t('placeTitle')}</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('amountLabel')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={amount}
                onChange={(event) => {
                  setAmount(Math.max(1, Number(event.target.value) || 1));
                }}
              />
              <Button type="button" variant="outline" onClick={() => { setAmount((previous) => Math.max(1, previous - 10)); }}>-10</Button>
              <Button type="button" variant="outline" onClick={() => { setAmount((previous) => Math.max(1, previous - 50)); }}>-50</Button>
              <Button type="button" variant="outline" onClick={() => { setAmount((previous) => previous + 10); }}>+10</Button>
              <Button type="button" variant="outline" onClick={() => { setAmount((previous) => previous + 50); }}>+50</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('suggestedRange')}: {formatCurrency(suggestedMin, country)} - {formatCurrency(suggestedMax, country)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t('durationLabel')}</Label>
            <Select value={estimatedDuration} onValueChange={setEstimatedDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 48 }).map((_, index) => {
                  const value = (index + 1) * 0.5;
                  return (
                    <SelectItem key={value} value={value.toString()}>
                      {value}h
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('messageLabel')}</Label>
          <Textarea
            value={message}
            maxLength={500}
            onChange={(event) => {
              setMessage(event.target.value);
            }}
            placeholder={t('messagePlaceholder')}
          />
          <p className="text-xs text-muted-foreground">{message.length}/500</p>
        </div>

        <p className="text-sm font-medium text-emerald-600">
          {t('savings', { value: savings.toFixed(0) })}
        </p>

        <Button
          type="button"
          className="w-full"
          disabled={placeBid.isPending}
          onClick={() => {
            setSubmitState('loading');
            void placeBid.mutateAsync({
              job_id: resolvedJobId,
              amount,
              message: message.trim() ? message : undefined,
              estimated_duration_hours: Number(estimatedDuration)
            });
          }}
        >
          {submitState === 'loading'
            ? t('submitLoading')
            : submitState === 'success'
              ? t('submitSuccess')
              : t('submitIdle')}
        </Button>
      </motion.section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('myBids')}</h2>
        {(bidsQuery.data ?? []).map((bid, index) => (
          <BidCard
            key={bid.id}
            bid={bid}
            rank={index + 1}
            isLowest={index === 0}
            locale={locale}
            view="worker"
            onWithdraw={() => {
              void withdrawBid.mutateAsync(bid.id);
            }}
            isWithdrawing={withdrawBid.isPending}
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
        ))}
      </section>

      <JobReviewSection locale={locale} jobId={resolvedJobId} status={job.status} mode="worker" />
    </div>
  );
};

export default WorkerJobDetail;
