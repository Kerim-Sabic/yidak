'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';


import { gentleSpring } from '@/components/blocks/auth/motion';

interface AvailabilityToggleProps {
  label: string;
}

export const AvailabilityToggle = ({ label }: AvailabilityToggleProps): React.JSX.Element => {
  const [enabled, setEnabled] = useState(true);
  const reduceMotion = useReducedMotion();
  const transitionProps = reduceMotion ? {} : { transition: gentleSpring };

  return (
    <button
      type="button"
      onClick={() => {
        setEnabled((current) => !current);
      }}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
    >
      <span className={enabled ? 'text-emerald-600' : 'text-muted-foreground'}>{label}</span>
      <motion.span
        layout
        {...transitionProps}
        className={`relative inline-flex h-6 w-10 items-center rounded-full ${enabled ? 'bg-emerald-500/35' : 'bg-muted'}`}
      >
        <motion.span
          layout
          {...transitionProps}
          className={`h-4 w-4 rounded-full bg-emerald-600 ${enabled ? 'ms-5' : 'ms-1'}`}
        />
      </motion.span>
    </button>
  );
};
