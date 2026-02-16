'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

interface AuctionTimerProps {
  expiresAt: string;
  onExpired?: () => void;
  className?: string;
  expiredLabel?: string;
}

const toTimeLeft = (expiresAt: string, nowMs: number): TimeLeft => {
  const expiresMs = new Date(expiresAt).getTime();
  const remainingMs = Math.max(0, expiresMs - nowMs);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalSeconds };
};

const toTwoDigits = (value: number): string => value.toString().padStart(2, '0');

const useServerSyncedClock = (): (() => number) => {
  const offsetRef = useRef(0);

  useEffect(() => {
    const syncOffset = async (): Promise<void> => {
      const startedAt = Date.now();
      try {
        const response = await fetch('/api/trpc/ping', { method: 'HEAD' });
        const endedAt = Date.now();
        const dateHeader = response.headers.get('date');
        if (!dateHeader) {
          return;
        }

        const serverDateMs = new Date(dateHeader).getTime();
        const roundTrip = endedAt - startedAt;
        const estimatedNow = serverDateMs + roundTrip / 2;
        offsetRef.current = estimatedNow - endedAt;
      } catch {
        offsetRef.current = 0;
      }
    };

    void syncOffset();
  }, []);

  return () => Date.now() + offsetRef.current;
};

const Digit = ({ value }: { value: string }): React.JSX.Element => {
  const digits = value.split('');

  return (
    <div className="grid grid-cols-2 gap-1">
      {digits.map((digit, index) => (
        <div
          key={`${value}-${index}`}
          className="min-w-6 rounded-md border border-border/70 bg-background/90 px-1.5 py-1 text-center text-xs font-semibold"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={`${index}-${digit}`}
              initial={{ rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: 90, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="inline-block"
            >
              {digit}
            </motion.span>
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

export const AuctionTimer = ({
  expiresAt,
  onExpired,
  className,
  expiredLabel = 'Auction Ended'
}: AuctionTimerProps): React.JSX.Element => {
  const reducedMotion = useReducedMotion() ?? false;
  const nowWithOffset = useServerSyncedClock();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => toTimeLeft(expiresAt, nowWithOffset()));
  const expiredNotifiedRef = useRef(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeLeft(toTimeLeft(expiresAt, nowWithOffset()));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [expiresAt, nowWithOffset]);

  useEffect(() => {
    if (timeLeft.totalSeconds !== 0 || expiredNotifiedRef.current) {
      return;
    }

    expiredNotifiedRef.current = true;
    onExpired?.();
  }, [onExpired, timeLeft.totalSeconds]);

  const phase = useMemo(() => {
    if (timeLeft.totalSeconds <= 0) {
      return 'expired';
    }

    if (timeLeft.totalSeconds < 60) {
      return 'critical';
    }

    if (timeLeft.totalSeconds < 300) {
      return 'urgent';
    }

    if (timeLeft.totalSeconds < 3_600) {
      return 'active';
    }

    return 'calm';
  }, [timeLeft.totalSeconds]);

  if (phase === 'expired') {
    return (
      <motion.div
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn('rounded-xl bg-destructive/10 px-4 py-3 text-center text-sm font-medium text-destructive', className)}
      >
        {expiredLabel}
      </motion.div>
    );
  }

  const animatedStyle =
    phase === 'critical'
      ? {
          scale: [1, 1.03, 1],
          transition: { repeat: Infinity, duration: 1.1 }
        }
      : phase === 'urgent'
        ? {
            scale: [1, 1.01, 1],
            transition: { repeat: Infinity, duration: 2 }
          }
        : {};

  return (
    <motion.div
      animate={reducedMotion ? {} : animatedStyle}
      className={cn(
        'flex items-center justify-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-xs font-mono',
        phase === 'critical' && 'bg-destructive/10 text-destructive',
        phase === 'urgent' && 'bg-warning/10 text-warning',
        phase === 'active' && 'bg-primary/10 text-primary',
        phase === 'calm' && 'bg-muted text-muted-foreground',
        className
      )}
    >
      <Digit value={toTwoDigits(timeLeft.days)} />
      <span>:</span>
      <Digit value={toTwoDigits(timeLeft.hours)} />
      <span>:</span>
      <Digit value={toTwoDigits(timeLeft.minutes)} />
      <span>:</span>
      <Digit value={toTwoDigits(timeLeft.seconds)} />
    </motion.div>
  );
};

export default AuctionTimer;