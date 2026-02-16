'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CalendarClock, CheckCircle2, Circle } from 'lucide-react';

import { cn } from '@/lib/utils';

interface EscrowStatusLabels {
  fundsHeld: string;
  workInProgress: string;
  completed: string;
  released: string;
  amountHeld: string;
  authorizedAt: string;
  expectedRelease: string;
  pendingDate: string;
}

interface EscrowStatusProps {
  amount: number;
  currency: string;
  locale: 'en' | 'ar';
  activeStep?: 0 | 1 | 2 | 3;
  authorizedAt?: string | null;
  expectedReleaseAt?: string | null;
  labels: EscrowStatusLabels;
}

const formatCurrency = (amount: number, currency: string, locale: 'en' | 'ar'): string =>
  new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en', {
    style: 'currency',
    currency
  }).format(amount);

const formatDateLabel = (
  value: string | null | undefined,
  locale: 'en' | 'ar',
  fallback: string
): string => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

export const EscrowStatus = ({
  amount,
  currency,
  locale,
  activeStep = 0,
  authorizedAt,
  expectedReleaseAt,
  labels
}: EscrowStatusProps): React.JSX.Element => {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const steps = [labels.fundsHeld, labels.workInProgress, labels.completed, labels.released];
  const progressPercent = (activeStep / Math.max(steps.length - 1, 1)) * 100;

  return (
    <section className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{labels.amountHeld}</p>
          <p className="text-lg font-semibold">{formatCurrency(amount, currency, locale)}</p>
        </div>

        <div className="relative">
          <div className="absolute inset-x-0 top-3 h-[2px] rounded-full bg-border" />
          <motion.div
            className="absolute inset-y-[11px] start-0 h-[2px] rounded-full bg-primary"
            initial={prefersReducedMotion ? false : { width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', stiffness: 180, damping: 24 }}
          />
          <ul className="relative grid grid-cols-4 gap-2">
            {steps.map((stepLabel, index) => {
              const completed = index <= activeStep;
              return (
                <li key={stepLabel} className="space-y-1 text-center text-xs">
                  <div className="mx-auto flex h-6 w-6 items-center justify-center">
                    {completed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" aria-hidden />
                    )}
                  </div>
                  <p className={cn('text-muted-foreground', completed && 'font-medium text-foreground')}>
                    {stepLabel}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p className="inline-flex items-center gap-2">
            <CalendarClock className="h-4 w-4" aria-hidden />
            <span>
              {labels.authorizedAt}: {formatDateLabel(authorizedAt, locale, labels.pendingDate)}
            </span>
          </p>
          <p className="inline-flex items-center gap-2">
            <CalendarClock className="h-4 w-4" aria-hidden />
            <span>
              {labels.expectedRelease}: {formatDateLabel(expectedReleaseAt, locale, labels.pendingDate)}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default EscrowStatus;
