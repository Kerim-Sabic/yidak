'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Award,
  Camera,
  Clock3,
  Medal,
  MessageSquare,
  Star,
  Trophy,
  UserRoundCheck,
  Wrench
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { SuccessBurst } from '@/components/blocks/auth/success-burst';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface BadgeDefinition {
  id: string;
  icon: 'medal' | 'star' | 'clock' | 'trophy' | 'award' | 'camera' | 'chat' | 'city' | 'repeat' | 'job';
  title: string;
  description: string;
  progress: number;
  target: number;
  earnedAt: string | null;
}

interface BadgeGridProps {
  badges: ReadonlyArray<BadgeDefinition>;
}

const iconMap = {
  medal: Medal,
  star: Star,
  clock: Clock3,
  trophy: Trophy,
  award: Award,
  camera: Camera,
  chat: MessageSquare,
  city: UserRoundCheck,
  repeat: Wrench,
  job: Award
} as const;

const isEarned = (badge: BadgeDefinition): boolean => badge.earnedAt !== null || badge.progress >= badge.target;

export const BadgeGrid = ({ badges }: BadgeGridProps): React.JSX.Element => {
  const t = useTranslations('gamification.badges');
  const reducedMotion = useReducedMotion() ?? false;
  const [activeBadge, setActiveBadge] = useState<BadgeDefinition | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [knownEarned, setKnownEarned] = useState<ReadonlySet<string>>(new Set());

  const earnedIds = useMemo(
    () => new Set(badges.filter((badge) => isEarned(badge)).map((badge) => badge.id)),
    [badges]
  );

  useEffect(() => {
    if (knownEarned.size === 0) {
      setKnownEarned(earnedIds);
      return;
    }

    const hasNew = [...earnedIds].some((badgeId) => !knownEarned.has(badgeId));
    if (!hasNew) {
      return;
    }

    setKnownEarned(earnedIds);
    setShowCelebration(true);
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 760;
    gain.gain.value = 0.02;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
    window.setTimeout(() => {
      setShowCelebration(false);
    }, 700);
  }, [earnedIds, knownEarned]);

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {badges.map((badge) => {
          const Icon = iconMap[badge.icon];
          const earned = isEarned(badge);
          const progress = Math.max(0, Math.min(100, (badge.progress / Math.max(1, badge.target)) * 100));
          return (
            <motion.button
              key={badge.id}
              type="button"
              {...(reducedMotion ? {} : { whileHover: { y: -2 }, whileTap: { scale: 0.98 } })}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              onClick={() => {
                setActiveBadge(badge);
              }}
              className={`rounded-xl border p-3 text-start ${
                earned ? 'border-primary/40 bg-primary/5' : 'border-border grayscale'
              }`}
            >
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-4 w-4" />
              </div>
              <p className="line-clamp-2 text-sm font-medium">{badge.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {earned
                  ? t('earnedOn', { date: badge.earnedAt ?? t('today') })
                  : t('progress', { current: badge.progress, target: badge.target })}
              </p>
              {!earned ? <Progress value={progress} className="mt-2 h-1.5" /> : null}
            </motion.button>
          );
        })}
      </div>

      <Dialog
        open={activeBadge !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveBadge(null);
          }
        }}
      >
        <DialogContent>
          {activeBadge ? (
            <>
              <DialogHeader>
                <DialogTitle>{activeBadge.title}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">{activeBadge.description}</p>
              <div className="rounded-xl border border-border p-3 text-sm">
                <p>{t('detailProgress', { current: activeBadge.progress, target: activeBadge.target })}</p>
                <Progress
                  value={Math.max(
                    0,
                    Math.min(100, (activeBadge.progress / Math.max(1, activeBadge.target)) * 100)
                  )}
                  className="mt-2 h-2"
                />
              </div>
              {isEarned(activeBadge) ? (
                <Badge className="w-fit">{t('earnedBadge')}</Badge>
              ) : (
                <Badge variant="secondary" className="w-fit">
                  {t('lockedBadge')}
                </Badge>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <SuccessBurst active={showCelebration} />
    </section>
  );
};

export default BadgeGrid;

