'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { JobCategoryItem } from '@/components/blocks/job-posting/types';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CategoryGridProps {
  categories: ReadonlyArray<JobCategoryItem>;
  selectedCategoryId: string;
  onSelect: (categoryId: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 }
};

export const CategoryGrid = ({
  categories,
  selectedCategoryId,
  onSelect
}: CategoryGridProps): React.JSX.Element => {
  const reducedMotion = useReducedMotion();
  const t = useTranslations('customer.jobs.new.categories');

  const selected = categories.find((item) => item.id === selectedCategoryId) ?? null;

  return (
    <section className="space-y-5">
      <motion.div
        variants={containerVariants}
        initial={reducedMotion ? false : 'hidden'}
        animate="visible"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {categories.map((category) => {
          const Icon = category.icon;
          const active = category.id === selectedCategoryId;

          return (
            <motion.div key={category.id} variants={cardVariants} layout={!reducedMotion}>
              <Card
                role="button"
                tabIndex={0}
                onClick={() => { onSelect(category.id); }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    onSelect(category.id);
                  }
                }}
                aria-pressed={active}
                className={cn(
                  'relative cursor-pointer border-border/80 transition-colors duration-150',
                  active ? 'border-primary bg-primary/5' : 'hover:border-primary/40'
                )}
              >
                <motion.div
                  whileHover={
                    reducedMotion
                      ? {}
                      : {
                          y: -2,
                          boxShadow: '0 16px 30px oklch(0.48 0.08 195 / 0.18)'
                        }
                  }
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 120, damping: 14 }
                  }
                  className="h-full"
                >
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-full border border-primary/25 bg-primary/10 p-2 text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>

                      {active ? (
                        <motion.span
                          initial={reducedMotion ? false : { scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={
                            reducedMotion
                              ? { duration: 0 }
                              : { type: 'spring', stiffness: 300, damping: 30 }
                          }
                          className="rounded-full bg-primary/20 p-1 text-primary"
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        </motion.span>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-foreground">{t(`${category.slug}.name`)}</h3>
                      <p className="text-xs text-muted-foreground">{t(`${category.slug}.description`)}</p>
                    </div>
                  </CardContent>
                </motion.div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {selected ? (
        <motion.div
          key={selected.id}
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 120, damping: 14 }
          }
          className="space-y-2"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('subcategoriesLabel')}
          </p>

          <div className="flex flex-wrap gap-2">
            {selected.subcategoryKeys.map((key, index) => (
              <motion.span
                key={key}
                initial={reducedMotion ? false : { opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 120, damping: 14, delay: index * 0.04 }
                }
                className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground"
              >
                {t(`${selected.slug}.subcategories.${key}`)}
              </motion.span>
            ))}
          </div>
        </motion.div>
      ) : null}
    </section>
  );
};

export default CategoryGrid;
