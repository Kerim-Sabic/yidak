'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useFormStatus } from 'react-dom';


import { snappySpring } from '@/components/blocks/auth/motion';
import { cn } from '@/lib/utils';

interface AuthSubmitButtonProps {
  idleLabel: string;
  pendingLabel: string;
  className?: string;
}

export const AuthSubmitButton = ({
  idleLabel,
  pendingLabel,
  className
}: AuthSubmitButtonProps): React.JSX.Element => {
  const { pending } = useFormStatus();
  const reduceMotion = useReducedMotion();
  const tapProps = reduceMotion ? {} : { whileTap: { scale: 0.98 } };

  return (
    <motion.button
      type="submit"
      {...tapProps}
      transition={snappySpring}
      disabled={pending}
      className={cn(
        'inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-70',
        className
      )}
    >
      {pending ? pendingLabel : idleLabel}
    </motion.button>
  );
};
