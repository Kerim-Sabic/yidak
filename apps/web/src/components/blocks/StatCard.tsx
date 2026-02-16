'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  prefix?: string;
  suffix?: string;
}

const formatValue = (value: number): string => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);

export const StatCard = ({
  title,
  value,
  description,
  prefix,
  suffix
}: StatCardProps): React.JSX.Element => {
  const reducedMotion = useReducedMotion();
  const [counted, setCounted] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setCounted(value);
      return;
    }

    const startedAt = Date.now();
    const duration = 700;

    const tick = (): void => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - (1 - progress) * (1 - progress);
      setCounted(Math.round(value * eased));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [reducedMotion, value]);

  return (
    <Card className="overflow-hidden border-border/80 bg-gradient-to-br from-primary/10 via-card to-secondary/20">
      <CardContent className="space-y-2 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 300, damping: 30 }
          }
          className="text-2xl font-bold text-foreground"
        >
          {prefix ?? ''}
          {formatValue(counted)}
          {suffix ?? ''}
        </motion.p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

export default StatCard;
