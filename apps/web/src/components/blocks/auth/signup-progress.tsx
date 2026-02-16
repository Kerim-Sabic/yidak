'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { gentleSpring } from '@/components/blocks/auth/motion';

interface SignupProgressProps {
  currentStep: number;
  labels: ReadonlyArray<string>;
}

export const SignupProgress = ({ currentStep, labels }: SignupProgressProps): React.JSX.Element => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 items-center gap-2">
        {labels.map((label, index) => {
          const step = index + 1;
          const done = step <= currentStep;

          return (
            <div key={label} className="flex items-center gap-2">
              <motion.span
                layout
                transition={gentleSpring}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                {step}
              </motion.span>
              <span className="hidden text-xs text-muted-foreground sm:inline">{label}</span>
              {step < labels.length ? (
                <motion.span
                  initial={reduceMotion ? false : { scaleX: 0 }}
                  animate={{ scaleX: done ? 1 : 0.2 }}
                  transition={gentleSpring}
                  className="hidden h-0.5 flex-1 origin-start rounded bg-primary/40 sm:block"
                />
              ) : <></>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
