'use client';

import { getTierBenefits } from '@yidak/utils';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { WorkerTier } from '@yidak/types';

interface TierProgressProps {
  currentTier: WorkerTier;
  totalJobs: number;
  locale: 'en' | 'ar';
}

const tiers: ReadonlyArray<{ key: WorkerTier; threshold: number }> = [
  { key: 'bronze', threshold: 0 },
  { key: 'silver', threshold: 10 },
  { key: 'gold', threshold: 50 },
  { key: 'platinum', threshold: 200 }
];

const nextTier = (tier: WorkerTier): { tier: WorkerTier; threshold: number } | null => {
  const index = tiers.findIndex((item) => item.key === tier);
  if (index < 0 || index === tiers.length - 1) {
    return null;
  }

  const next = tiers[index + 1];
  if (!next) {
    return null;
  }

  return {
    tier: next.key,
    threshold: next.threshold
  };
};

const progressPercent = (tier: WorkerTier, totalJobs: number): number => {
  const index = tiers.findIndex((item) => item.key === tier);
  if (index < 0) {
    return 0;
  }

  if (index === tiers.length - 1) {
    return 100;
  }

  const current = tiers[index];
  const next = tiers[index + 1];
  if (!current || !next) {
    return 0;
  }

  const span = next.threshold - current.threshold;
  if (span <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, ((totalJobs - current.threshold) / span) * 100));
};

export const TierProgress = ({ currentTier, totalJobs, locale }: TierProgressProps): React.JSX.Element => {
  void locale;
  const t = useTranslations('gamification.tierProgress');
  const reducedMotion = useReducedMotion() ?? false;
  const upcoming = nextTier(currentTier);
  const percentage = progressPercent(currentTier, totalJobs);
  const benefits = getTierBenefits(currentTier);

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <div className="relative">
        <div className="h-2 rounded-full bg-muted" />
        <motion.div
          initial={reducedMotion ? false : { width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 140, damping: 22 }}
          className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-e from-amber-500 to-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tiers.map((item) => {
          const reached = totalJobs >= item.threshold;
          const active = item.key === currentTier;
          return (
            <div
              key={item.key}
              className={`rounded-xl border p-2 text-center text-xs ${
                active ? 'border-primary bg-primary/10' : 'border-border'
              }`}
            >
              <p className="mb-1 inline-flex items-center gap-1 font-semibold">
                {reached ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}
                {t(`tiers.${item.key}`)}
              </p>
              <p className="text-muted-foreground">{t('jobsNeeded', { count: item.threshold })}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border p-3 text-sm">
        {upcoming ? (
          <p className="text-muted-foreground">
            {t('nextTier', {
              count: Math.max(0, upcoming.threshold - totalJobs),
              tier: t(`tiers.${upcoming.tier}`)
            })}
          </p>
        ) : (
          <p className="text-emerald-600">{t('topTier')}</p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="p-2 text-start">{t('benefits.benefit')}</th>
              <th className="p-2 text-start">{t('benefits.value')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2">{t('benefits.commission')}</td>
              <td className="p-2">{Math.round(benefits.commissionRate * 100)}%</td>
            </tr>
            <tr>
              <td className="p-2">{t('benefits.maxBids')}</td>
              <td className="p-2">{benefits.maxActiveBids}</td>
            </tr>
            <tr>
              <td className="p-2">{t('benefits.badge')}</td>
              <td className="p-2">{benefits.profileBadge ? t('yes') : t('no')}</td>
            </tr>
            <tr>
              <td className="p-2">{t('benefits.priority')}</td>
              <td className="p-2">{benefits.priorityListing ? t('yes') : t('no')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TierProgress;
