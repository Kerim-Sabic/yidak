'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Crown, Medal, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc/client';

interface WorkerLeaderboardProps {
  locale: 'en' | 'ar';
}

const categories = ['all', 'plumbing', 'electrical', 'ac-hvac'] as const;
const cities = ['all', 'Dubai', 'Abu Dhabi', 'Riyadh', 'Jeddah', 'Doha', 'Muscat', 'Kuwait City'] as const;

const podiumIcon = (rank: number): React.JSX.Element => {
  if (rank === 1) {
    return <Crown className="h-4 w-4 text-amber-500" />;
  }

  if (rank === 2) {
    return <Trophy className="h-4 w-4 text-slate-500" />;
  }

  return <Medal className="h-4 w-4 text-orange-600" />;
};

export const WorkerLeaderboard = ({ locale }: WorkerLeaderboardProps): React.JSX.Element => {
  void locale;
  const t = useTranslations('leaderboard');
  const reducedMotion = useReducedMotion() ?? false;
  const [category, setCategory] = useState<(typeof categories)[number]>('all');
  const [city, setCity] = useState<(typeof cities)[number]>('all');

  const query = trpc.referral.leaderboard.useQuery({
    category,
    city,
    limit: 50
  });

  const topThree = useMemo(() => query.data?.items.slice(0, 3) ?? [], [query.data?.items]);
  const list = useMemo(() => query.data?.items ?? [], [query.data?.items]);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr,16rem]">
        <Tabs
          value={category}
          onValueChange={(value) => {
            setCategory(value as (typeof categories)[number]);
          }}
        >
          <TabsList className="grid w-full grid-cols-4">
            {categories.map((item) => (
              <TabsTrigger key={item} value={item}>
                {t(`categories.${item}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Select
          value={city}
          onValueChange={(value) => {
            setCity(value as (typeof cities)[number]);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('cityPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {cities.map((item) => (
              <SelectItem key={item} value={item}>
                {item === 'all' ? t('allCities') : item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {topThree.map((worker, index) => (
          <motion.div
            key={worker.user_id}
            {...(reducedMotion
              ? {}
              : {
                  initial: { opacity: 0, y: 8 },
                  animate: { opacity: 1, y: 0 }
                })}
            transition={{ type: 'spring', stiffness: 160, damping: 20, delay: index * 0.05 }}
          >
            <Card className={worker.is_current_user ? 'border-primary bg-primary/5' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{worker.full_name}</span>
                  <span className="inline-flex items-center gap-1">
                    {podiumIcon(worker.rank)} #{worker.rank}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>{t('score', { score: worker.score.toFixed(1) })}</p>
                <p className="text-muted-foreground">{t('rating', { value: worker.average_rating.toFixed(1) })}</p>
                <p className="text-muted-foreground">{t('jobs', { value: worker.total_jobs })}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('topWorkers')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">{t('loading')}</p>
          ) : (
            list.map((worker) => (
              <div
                key={worker.user_id}
                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${
                  worker.is_current_user ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    #{worker.rank} {worker.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {worker.city} · {worker.total_jobs} {t('jobsLabel')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{worker.tier}</Badge>
                  <p className="font-semibold">{worker.score.toFixed(1)}</p>
                </div>
              </div>
            ))
          )}
          {!query.isLoading && list.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          ) : null}
        </CardContent>
      </Card>

      {query.data?.current_user_rank ? (
        <p className="text-sm text-muted-foreground">
          {t('yourRank', { rank: query.data.current_user_rank })}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">{t('notRanked')}</p>
      )}
    </section>
  );
};

export default WorkerLeaderboard;
