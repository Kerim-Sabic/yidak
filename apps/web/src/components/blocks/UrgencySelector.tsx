'use client';

import { motion, useReducedMotion } from 'framer-motion';

import type { UrgencyLevel } from '@yidak/types';

import { cn } from '@/lib/utils';

interface UrgencyOption {
  value: UrgencyLevel;
  icon: string;
  label: string;
  timeLimit: string;
  surchargeLabel: string;
}

interface UrgencySelectorProps {
  options: ReadonlyArray<UrgencyOption>;
  value: UrgencyLevel;
  onChange: (value: UrgencyLevel) => void;
}

const urgencyClass: Readonly<Record<UrgencyLevel, string>> = {
  flexible: 'border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  normal: 'border-amber-300 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  urgent: 'border-orange-300 bg-orange-500/10 text-orange-700 dark:text-orange-300',
  emergency: 'border-rose-300 bg-rose-500/10 text-rose-700 dark:text-rose-300'
};

export const UrgencySelector = ({
  options,
  value,
  onChange
}: UrgencySelectorProps): React.JSX.Element => {
  const reducedMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <motion.button
            type="button"
            key={option.value}
            onClick={() => { onChange(option.value); }}
            whileHover={
              reducedMotion
                ? {}
                : {
                    y: -2
                  }
            }
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 120, damping: 14 }
            }
            className={cn(
              'rounded-xl border p-3 text-start transition-colors',
              active ? urgencyClass[option.value] : 'border-border bg-card hover:border-primary/40'
            )}
            aria-pressed={active}
          >
            <p className="text-xl" aria-hidden="true">
              {option.icon}
            </p>
            <p className="mt-2 text-sm font-semibold">{option.label}</p>
            <p className="text-xs text-muted-foreground">{option.timeLimit}</p>
            <p className="mt-1 text-xs">{option.surchargeLabel}</p>
          </motion.button>
        );
      })}
    </div>
  );
};

export type { UrgencyOption };
export default UrgencySelector;
