'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface StepIndicatorProps {
  currentStep: number;
  steps: ReadonlyArray<string>;
}

const circleClass =
  'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors';

export const StepIndicator = ({ currentStep, steps }: StepIndicatorProps): React.JSX.Element => {
  const reducedMotion = useReducedMotion();

  return (
    <div className="space-y-3" aria-label="Step indicator">
      <div className="flex items-center gap-3">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const completed = stepNumber < currentStep;
          const active = stepNumber === currentStep;

          return (
            <div key={label} className="flex min-w-0 flex-1 items-center gap-3">
              <motion.div
                layout={!reducedMotion}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 300, damping: 30 }
                }
                className={
                  completed || active
                    ? `${circleClass} border-primary bg-primary text-primary-foreground`
                    : `${circleClass} border-border bg-card text-muted-foreground`
                }
              >
                {completed ? '?' : stepNumber}
              </motion.div>

              {index < steps.length - 1 ? (
                <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={false}
                    animate={{ width: completed ? '100%' : '0%' }}
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 120, damping: 14 }
                    }
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground">
        {steps.map((label, index) => {
          const active = index + 1 === currentStep;

          return (
            <p
              key={label}
              className={active ? 'font-semibold text-foreground' : 'font-medium'}
            >
              {label}
            </p>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
