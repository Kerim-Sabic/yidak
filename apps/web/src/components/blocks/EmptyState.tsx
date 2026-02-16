'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
}

export const EmptyState = ({
  title,
  description,
  ctaLabel,
  onCta
}: EmptyStateProps): React.JSX.Element => {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 120, damping: 14 }
      }
      className="rounded-2xl border border-border bg-card p-8 text-center"
    >
      <svg
        width="120"
        height="84"
        viewBox="0 0 120 84"
        fill="none"
        className="mx-auto"
        aria-hidden="true"
      >
        <rect x="8" y="12" width="104" height="64" rx="16" fill="color-mix(in oklch, var(--primary) 15%, transparent)" />
        <rect x="22" y="28" width="76" height="8" rx="4" fill="color-mix(in oklch, var(--primary) 40%, transparent)" />
        <rect x="22" y="42" width="52" height="8" rx="4" fill="color-mix(in oklch, var(--muted-foreground) 35%, transparent)" />
      </svg>

      <h3 className="mt-5 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      <Button onClick={onCta} className="mt-6 w-full sm:w-auto">
        {ctaLabel}
      </Button>
    </motion.div>
  );
};

export default EmptyState;
