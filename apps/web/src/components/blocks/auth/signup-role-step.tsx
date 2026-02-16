'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { ROLE_OPTIONS, type SignupRole } from '@/components/blocks/auth/constants';
import { gentleSpring } from '@/components/blocks/auth/motion';

interface SignupRoleStepProps {
  role: SignupRole;
  title: string;
  customerTitle: string;
  customerDescription: string;
  workerTitle: string;
  workerDescription: string;
  nextLabel: string;
  onRoleChange: (role: SignupRole) => void;
  onNext: () => void;
}

const roleCardClassName = (selected: boolean): string =>
  `rounded-xl border p-4 transition ${selected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'}`;

export const SignupRoleStep = ({
  role,
  title,
  customerTitle,
  customerDescription,
  workerTitle,
  workerDescription,
  nextLabel,
  onRoleChange,
  onNext
}: SignupRoleStepProps): React.JSX.Element => {
  const reduceMotion = useReducedMotion();
  const hoverProps = reduceMotion ? {} : { whileHover: { scale: 1.03 } };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <div className="grid gap-3">
        {ROLE_OPTIONS.map((value) => {
          const selected = value === role;
          const itemTitle = value === 'customer' ? customerTitle : workerTitle;
          const itemDescription = value === 'customer' ? customerDescription : workerDescription;

          return (
            <motion.button
              key={value}
              type="button"
              {...hoverProps}
              transition={gentleSpring}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={roleCardClassName(selected)}
              onClick={() => {
                onRoleChange(value);
              }}
            >
              <div className="flex items-start justify-between gap-3 text-start">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{itemTitle}</p>
                  <p className="text-xs text-muted-foreground">{itemDescription}</p>
                </div>
                <span
                  className={`mt-1 h-5 w-5 rounded-full border ${selected ? 'border-primary bg-primary' : 'border-border'}`}
                  aria-hidden
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        {nextLabel}
      </button>
    </div>
  );
};
