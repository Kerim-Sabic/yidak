'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Info } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface BudgetSliderProps {
  value: readonly [number, number];
  minLimit: number;
  maxLimit: number;
  currencyLabel: string;
  minLabel: string;
  maxLabel: string;
  suggestionLabel: string;
  suggestionText: string;
  onChange: (next: readonly [number, number]) => void;
  disabled?: boolean;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const toBudgetPair = (value: ReadonlyArray<number>): readonly [number, number] => {
  const first = value[0] ?? 0;
  const second = value[1] ?? first;

  return first <= second ? [first, second] : [second, first];
};

export const BudgetSlider = ({
  value,
  minLimit,
  maxLimit,
  currencyLabel,
  minLabel,
  maxLabel,
  suggestionLabel,
  suggestionText,
  onChange,
  disabled = false
}: BudgetSliderProps): React.JSX.Element => {
  const reducedMotion = useReducedMotion();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{currencyLabel}</p>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-4 w-4" aria-hidden="true" />
              {suggestionLabel}
            </TooltipTrigger>
            <TooltipContent side="top" align="end">
              <p className="max-w-56 text-xs">{suggestionText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <Slider
            disabled={disabled}
            value={[value[0], value[1]]}
            min={minLimit}
            max={maxLimit}
            step={10}
            onValueChange={(next) => { onChange(toBudgetPair(next)); }}
            className="[&_[role=slider]]:shadow-[0_0_0_6px_oklch(0.67_0.11_190_/_0.15)]"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-2 text-xs text-muted-foreground">
            {minLabel}
            <Input
              type="number"
              inputMode="numeric"
              min={minLimit}
              max={maxLimit}
              value={value[0]}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                const nextMin = clamp(parsed, minLimit, maxLimit);
                onChange(toBudgetPair([nextMin, value[1]]));
              }}
            />
          </label>

          <label className="space-y-2 text-xs text-muted-foreground">
            {maxLabel}
            <Input
              type="number"
              inputMode="numeric"
              min={minLimit}
              max={maxLimit}
              value={value[1]}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                const nextMax = clamp(parsed, minLimit, maxLimit);
                onChange(toBudgetPair([value[0], nextMax]));
              }}
            />
          </label>
        </div>
      </div>

      <motion.div
        animate={reducedMotion ? { opacity: 1 } : { opacity: [0.5, 1, 0.5] }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 120, damping: 14, repeat: Infinity }
        }
        className="h-1 rounded-full bg-gradient-to-r from-primary via-chart-2 to-secondary"
      />
    </div>
  );
};

export default BudgetSlider;
