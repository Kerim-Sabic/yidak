'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { Button } from '@/components/ui/button';

interface ErrorBoundaryViewProps {
  title: string;
  description: string;
  retryLabel: string;
  reset: () => void;
}

export const ErrorBoundaryView = ({
  title,
  description,
  retryLabel,
  reset,
}: ErrorBoundaryViewProps): React.JSX.Element => {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <motion.main
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 160, damping: 20 }}
      className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-12 text-center"
    >
      <svg
        viewBox="0 0 160 120"
        role="img"
        aria-hidden
        className="text-muted-foreground/55 h-28 w-36"
        fill="none"
      >
        <rect x="12" y="20" width="136" height="84" rx="14" stroke="currentColor" strokeWidth="2" />
        <path d="M36 46h88M36 62h64M36 78h52" stroke="currentColor" strokeLinecap="round" />
        <circle cx="116" cy="80" r="16" fill="currentColor" opacity="0.12" />
        <path
          d="M116 72v10m0 8h.01"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
      </svg>
      <h2 className="text-foreground text-2xl font-bold">{title}</h2>
      <p className="text-muted-foreground max-w-md text-sm">{description}</p>
      <Button type="button" onClick={reset}>
        {retryLabel}
      </Button>
    </motion.main>
  );
};

export default ErrorBoundaryView;
