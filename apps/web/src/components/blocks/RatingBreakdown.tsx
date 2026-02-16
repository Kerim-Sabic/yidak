'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface RatingDistribution {
  five: number;
  four: number;
  three: number;
  two: number;
  one: number;
}

interface CategoryAverages {
  quality: number;
  timeliness: number;
  communication: number;
  value: number;
  cleanliness: number;
}

interface RatingBreakdownProps {
  average: number;
  totalReviews: number;
  distribution: RatingDistribution;
  categories: CategoryAverages;
}

const toPercent = (count: number, total: number): number => {
  if (total <= 0) {
    return 0;
  }

  return (count / total) * 100;
};

const rowEntries = (distribution: RatingDistribution): ReadonlyArray<{ label: string; value: number }> => [
  { label: '5', value: distribution.five },
  { label: '4', value: distribution.four },
  { label: '3', value: distribution.three },
  { label: '2', value: distribution.two },
  { label: '1', value: distribution.one }
];

const StarText = ({ average }: { average: number }): React.JSX.Element => (
  <span className="inline-flex items-center gap-0.5 text-amber-500">
    {Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={`breakdown-star-${average}-${index}`}
        className={index < Math.round(average) ? 'h-3.5 w-3.5 fill-amber-400 text-amber-400' : 'h-3.5 w-3.5 text-muted-foreground'}
      />
    ))}
  </span>
);

export const RatingBreakdown = ({
  average,
  totalReviews,
  distribution,
  categories
}: RatingBreakdownProps): React.JSX.Element => {
  const t = useTranslations('reviews.breakdown');
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold">{average.toFixed(1)}</p>
          <StarText average={average} />
        </div>
        <p className="text-sm text-muted-foreground">{t('totalReviews', { count: totalReviews })}</p>
      </div>

      <div className="space-y-2">
        {rowEntries(distribution).map((entry) => {
          const percentage = toPercent(entry.value, totalReviews);
          return (
            <div key={`distribution-${entry.label}`} className="grid grid-cols-[auto,1fr,auto] items-center gap-2">
              <span className="text-xs text-muted-foreground">{entry.label}*</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={reducedMotion ? false : { width: 0 }}
                  whileInView={{ width: `${percentage}%` }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                  className="h-full bg-primary"
                />
              </div>
              <span className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {[
          { key: 'quality', value: categories.quality },
          { key: 'timeliness', value: categories.timeliness },
          { key: 'communication', value: categories.communication },
          { key: 'value', value: categories.value },
          { key: 'cleanliness', value: categories.cleanliness }
        ].map((item) => (
          <div key={`category-${item.key}`} className="flex items-center justify-between rounded-lg border p-2 text-xs">
            <span className="text-muted-foreground">{t(`categories.${item.key}`)}</span>
            <span className="inline-flex items-center gap-1 font-medium">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {item.value.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RatingBreakdown;
