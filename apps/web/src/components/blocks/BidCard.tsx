'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Clock3, ShieldCheck, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface BidCardWorker {
  id: string;
  full_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  average_rating: number | null;
  completion_rate: number | null;
  response_time_minutes: number | null;
  total_reviews: number;
  distance_km: number | null;
}

export interface BidCardData {
  id: string;
  amount: number;
  currency: string;
  message: string | null;
  status: string;
  estimated_duration_hours: number;
  created_at: string;
  worker: BidCardWorker | null;
}

interface BidCardProps {
  bid: BidCardData;
  rank: number;
  isLowest: boolean;
  locale: 'en' | 'ar';
  view: 'customer' | 'worker';
  labels: {
    duration: string;
    status: string;
    completionRate: string;
    acceptBid: string;
    accepting: string;
    withdraw: string;
    withdrawing: string;
    showLess: string;
    readMore: string;
    lowest: string;
  };
  onAccept?: () => void;
  onWithdraw?: () => void;
  isAccepting?: boolean;
  isWithdrawing?: boolean;
  previousLowestAmount?: number | null;
}

const tierBorderClass = (tier: BidCardWorker['tier'] | null): string => {
  if (tier === 'platinum') return 'border-sky-500';
  if (tier === 'gold') return 'border-amber-500';
  if (tier === 'silver') return 'border-slate-400';
  return 'border-amber-700';
};

const tierRingClass = (tier: BidCardWorker['tier'] | null): string => {
  if (tier === 'platinum') return 'ring-sky-500/70';
  if (tier === 'gold') return 'ring-amber-500/70';
  if (tier === 'silver') return 'ring-slate-400/70';
  return 'ring-amber-700/70';
};

const playLowestBidChime = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.localStorage.getItem('yidak:mute-sounds') === '1') {
    return;
  }

  const context = new window.AudioContext();
  const notes = [523.25, 659.25, 783.99];

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.0001;
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    const start = context.currentTime + index * 0.06;
    const end = start + 0.12;
    gainNode.gain.exponentialRampToValueAtTime(0.06, start + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.start(start);
    oscillator.stop(end);
  });
};

const toCurrencyLabel = (amount: number, currency: string, locale: 'en' | 'ar'): string =>
  new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'KWD' || currency === 'BHD' || currency === 'OMR' ? 3 : 2
  }).format(amount);

const toHoursLabel = (hours: number): string => {
  if (hours % 1 === 0) {
    return `${hours}h`;
  }

  return `${hours.toFixed(1)}h`;
};

const toInitials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

export const BidCard = ({
  bid,
  rank,
  isLowest,
  locale,
  view,
  labels,
  onAccept,
  onWithdraw,
  isAccepting = false,
  isWithdrawing = false,
  previousLowestAmount = null
}: BidCardProps): React.JSX.Element => {
  const reducedMotion = useReducedMotion() ?? false;
  const [expanded, setExpanded] = useState(false);
  const isNewLowest = isLowest && previousLowestAmount !== null && previousLowestAmount > bid.amount;

  useEffect(() => {
    if (!isNewLowest || reducedMotion) {
      return;
    }

    playLowestBidChime();
  }, [isNewLowest, reducedMotion]);

  const worker = bid.worker;
  const displayedMessage = useMemo(() => {
    if (!bid.message) {
      return null;
    }

    if (expanded || bid.message.length <= 120) {
      return bid.message;
    }

    return `${bid.message.slice(0, 120)}...`;
  }, [bid.message, expanded]);

  const interaction = reducedMotion
    ? {}
    : {
        whileHover: { y: -2 },
        whileTap: { scale: 0.995 }
      };

  return (
    <motion.article
      {...interaction}
      initial={false}
      animate={isNewLowest && !reducedMotion ? { boxShadow: ['0 0 0 rgba(0,0,0,0)', '0 0 28px rgba(245, 158, 11, 0.25)', '0 0 0 rgba(0,0,0,0)'] } : {}}
      transition={isNewLowest ? { duration: 1.2 } : { type: 'spring', stiffness: 120, damping: 14 }}
      className={cn(
        'rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors',
        'border-s-4',
        tierBorderClass(worker?.tier ?? null),
        isLowest && 'bg-emerald-500/5 border-emerald-500/40'
      )}
      aria-live={isLowest ? 'polite' : 'off'}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn('relative rounded-full ring-2', tierRingClass(worker?.tier ?? null))}>
            <Avatar className="h-11 w-11">
              <AvatarImage src={worker?.avatar_url ?? undefined} alt={worker?.full_name ?? 'Worker'} />
              <AvatarFallback>{toInitials(worker?.full_name ?? 'Worker')}</AvatarFallback>
            </Avatar>
            <Badge className="absolute -bottom-1 -end-2 px-1.5 py-0 text-[10px] uppercase">
              {worker?.tier ?? 'bronze'}
            </Badge>
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold">{worker?.full_name ?? 'Worker'}</p>
              {worker?.is_verified ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                {(worker?.average_rating ?? 0).toFixed(1)} ({worker?.total_reviews ?? 0})
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" aria-hidden />
                {worker?.response_time_minutes ?? 0}m
              </span>
              {worker && worker.distance_km !== null ? <span>{worker.distance_km.toFixed(1)} km</span> : null}
            </div>
          </div>
        </div>

        <div className="text-end">
          <motion.p
            key={`${bid.id}-${bid.amount}`}
            initial={reducedMotion ? false : { opacity: 0.4, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('text-xl font-bold leading-none', isLowest ? 'text-emerald-600' : 'text-foreground')}
          >
            {toCurrencyLabel(bid.amount, bid.currency, locale)}
          </motion.p>
          <div className="mt-1 flex items-center justify-end gap-1">
            <Badge variant="secondary">#{rank}</Badge>
            {isLowest ? (
              <motion.div initial={reducedMotion ? false : { scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <Badge className="bg-emerald-600 text-white">{labels.lowest}</Badge>
              </motion.div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <p>
          {labels.duration}: {toHoursLabel(bid.estimated_duration_hours)}
        </p>
        <p className="text-end">
          {labels.status}: {bid.status}
        </p>
      </div>

      {displayedMessage ? (
        <div className="mt-3 space-y-1">
          <p className="text-sm text-muted-foreground">{displayedMessage}</p>
          {bid.message && bid.message.length > 120 ? (
            <button
              type="button"
              className="text-xs font-medium text-primary"
              onClick={() => {
                setExpanded((previous) => !previous);
              }}
            >
              {expanded ? labels.showLess : labels.readMore}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{labels.completionRate}</span>
          <span>{Math.round(worker?.completion_rate ?? 0)}%</span>
        </div>
        <Progress value={worker?.completion_rate ?? 0} aria-label="Completion rate" />
      </div>

      <div className="mt-4 flex justify-end">
        {view === 'customer' ? (
          <Button type="button" disabled={!onAccept || isAccepting} onClick={onAccept}>
            {isAccepting ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 animate-pulse" aria-hidden />
                {labels.accepting}
              </span>
            ) : (
              labels.acceptBid
            )}
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled={!onWithdraw || isWithdrawing} onClick={onWithdraw}>
            {isWithdrawing ? labels.withdrawing : labels.withdraw}
          </Button>
        )}
      </div>
    </motion.article>
  );
};

export default BidCard;
