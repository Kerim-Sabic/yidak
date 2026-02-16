'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

interface CountdownTimerProps {
  expiresAt: string | null;
  expiredLabel: string;
}

const remainingMs = (expiresAt: string | null): number => {
  if (!expiresAt) {
    return 0;
  }

  const target = new Date(expiresAt).getTime();
  if (Number.isNaN(target)) {
    return 0;
  }

  return Math.max(0, target - Date.now());
};

const toText = (valueMs: number): string => {
  const seconds = Math.floor(valueMs / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
};

const colorByTime = (valueMs: number): string => {
  const minutes = valueMs / 60_000;

  if (minutes <= 10) {
    return 'text-rose-600';
  }

  if (minutes <= 60) {
    return 'text-orange-600';
  }

  return 'text-emerald-600';
};

export const CountdownTimer = ({ expiresAt, expiredLabel }: CountdownTimerProps): React.JSX.Element => {
  const reducedMotion = useReducedMotion();
  const [timeLeft, setTimeLeft] = useState(() => remainingMs(expiresAt));

  useEffect(() => {
    setTimeLeft(remainingMs(expiresAt));

    if (!expiresAt) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => {
        const next = Math.max(0, previous - 1000);
        return next;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [expiresAt]);

  const label = useMemo(() => (timeLeft > 0 ? toText(timeLeft) : expiredLabel), [expiredLabel, timeLeft]);
  const color = colorByTime(timeLeft);

  return (
    <motion.span
      animate={
        reducedMotion
          ? { scale: 1 }
          : {
              scale: timeLeft <= 10 * 60_000 ? [1, 1.03, 1] : 1
            }
      }
      transition={
        reducedMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 200, damping: 10, repeat: Infinity }
      }
      className={`inline-flex rounded-full bg-muted px-2 py-1 text-xs font-semibold ${color}`}
    >
      {label}
    </motion.span>
  );
};

export default CountdownTimer;
