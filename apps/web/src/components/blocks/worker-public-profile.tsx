'use client';

import { UserIdSchema } from '@yidak/types';
import { motion, useReducedMotion } from 'framer-motion';
import { BadgeCheck, Circle, Clock3, MapPin, ShieldCheck, Star } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { RatingBreakdown } from '@/components/blocks/RatingBreakdown';
import { ReviewCard } from '@/components/blocks/ReviewCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';

interface WorkerPublicProfileProps {
  locale: 'en' | 'ar';
  userId: string;
}

const fallbackWorkerId = '00000000-0000-4000-8000-000000000000';

const parsePoint = (raw: string): { latitude: number; longitude: number } => {
  const match = /POINT\((-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/.exec(raw);
  if (!match) {
    return { latitude: 25.2048, longitude: 55.2708 };
  }

  const longitude = Number(match[1]);
  const latitude = Number(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { latitude: 25.2048, longitude: 55.2708 };
  }

  return { latitude, longitude };
};

const mapImageSrc = (latitude: number, longitude: number): string =>
  `https://maps.google.com/maps?q=${latitude},${longitude}&z=11&output=embed`;

const initialsFromName = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

const tierClass = (tier: string): string => {
  if (tier === 'platinum') {
    return 'ring-2 ring-transparent bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 p-1';
  }

  if (tier === 'gold') {
    return 'ring-2 ring-amber-500 p-1';
  }

  if (tier === 'silver') {
    return 'ring-2 ring-slate-400 p-1';
  }

  return 'ring-2 ring-orange-700 p-1';
};

const formatDate = (value: string, locale: 'en' | 'ar'): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', { dateStyle: 'medium' }).format(date);
};

const formatNumber = (value: number, locale: 'en' | 'ar'): string =>
  new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en', { maximumFractionDigits: 1 }).format(value);

const formatCurrency = (amount: number, locale: 'en' | 'ar'): string =>
  new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en', {
    style: 'currency',
    currency: 'AED'
  }).format(amount);

const AnimatedCounter = ({ value }: { value: number }): React.JSX.Element => {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const duration = 800;

    const tick = (time: number): void => {
      const elapsed = time - start;
      const progress = Math.min(1, elapsed / duration);
      setDisplayed(value * progress);
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [value]);

  return <>{Math.round(displayed)}</>;
};

export const WorkerPublicProfile = ({ locale, userId }: WorkerPublicProfileProps): React.JSX.Element => {
  const t = useTranslations('workers.publicProfile');
  const reducedMotion = useReducedMotion() ?? false;

  const parsedUserId = UserIdSchema.safeParse(userId);
  const resolvedUserId = parsedUserId.success ? parsedUserId.data : fallbackWorkerId;
  const profileQuery = trpc.user.getWorkerProfile.useQuery(
    { user_id: resolvedUserId },
    { enabled: parsedUserId.success }
  );

  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredReviews = useMemo(() => {
    const payload = profileQuery.data;
    if (!payload) {
      return [];
    }

    const filtered = payload.reviews.filter((review) => {
      if (ratingFilter !== 'all' && Math.round(review.rating) !== Number(ratingFilter)) {
        return false;
      }

      if (categoryFilter === 'all') {
        return true;
      }

      if (categoryFilter === 'quality') {
        return review.quality_rating >= 4;
      }

      if (categoryFilter === 'timeliness') {
        return review.timeliness_rating >= 4;
      }

      if (categoryFilter === 'communication') {
        return review.communication_rating >= 4;
      }

      if (categoryFilter === 'value') {
        return review.value_rating >= 4;
      }

      if (categoryFilter === 'cleanliness') {
        return review.cleanliness_rating >= 4;
      }

      return true;
    });

    const sorted = [...filtered];
    if (sortBy === 'helpful') {
      sorted.sort(
        (a, b) => b.helpful_up - b.helpful_down - (a.helpful_up - a.helpful_down)
      );
      return sorted;
    }

    sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return sorted;
  }, [categoryFilter, profileQuery.data, ratingFilter, sortBy]);

  if (!parsedUserId.success) {
    return (
      <section className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
        {t('invalidWorker')}
      </section>
    );
  }

  if (profileQuery.isLoading || !profileQuery.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36" />
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const payload = profileQuery.data;
  const workerProfile = payload.worker_profile;
  const point = parsePoint(workerProfile?.location ?? '');

  if (!workerProfile) {
    return (
      <section className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
        {t('missingProfile')}
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('rounded-full', tierClass(workerProfile.tier))}>
              <Avatar className="h-24 w-24">
                <AvatarImage src={payload.profile.avatar_url ?? undefined} alt={payload.profile.full_name} />
                <AvatarFallback>{initialsFromName(payload.profile.full_name)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">{payload.profile.full_name}</h1>
              <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                {payload.profile.is_verified ? <ShieldCheck className="h-4 w-4 text-sky-600" /> : null}
                {t('memberSince', { date: formatDate(workerProfile.member_since, locale) })}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">
                  <BadgeCheck className="me-1 h-3.5 w-3.5" />
                  {t('tierBadge', { tier: workerProfile.tier })}
                </Badge>
                <Badge className="gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {formatNumber(workerProfile.average_rating, locale)} ({workerProfile.total_reviews})
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  {t('responseTime', { minutes: workerProfile.response_time_minutes })}
                </Badge>
                <Badge variant={workerProfile.is_available ? 'default' : 'secondary'} className="gap-1">
                  <Circle className="h-2.5 w-2.5 fill-current" />
                  {workerProfile.is_available ? t('available') : t('busy')}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/${locale}/customer/jobs/new?worker_id=${resolvedUserId}`}>
                {t('actions.request')}
              </Link>
            </Button>
            {payload.can_contact && payload.active_job_id ? (
              <Button asChild variant="outline">
                <Link href={`/${locale}/customer/jobs/${payload.active_job_id}`}>{t('actions.contact')}</Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                {t('actions.contact')}
              </Button>
            )}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        className="grid grid-cols-2 gap-3 lg:grid-cols-5"
      >
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">{t('stats.jobsCompleted')}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold"><AnimatedCounter value={workerProfile.total_jobs} /></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">{t('stats.completionRate')}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{workerProfile.completion_rate.toFixed(0)}%</CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">{t('stats.onTimeRate')}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{workerProfile.on_time_rate.toFixed(0)}%</CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">{t('stats.repeatCustomers')}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold"><AnimatedCounter value={workerProfile.repeat_customers} /></CardContent></Card>
        {payload.is_owner ? <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">{t('stats.totalEarnings')}</CardTitle></CardHeader><CardContent className="text-lg font-semibold">{formatCurrency(workerProfile.total_earnings, locale)}</CardContent></Card> : null}
      </motion.section>

      <motion.section initial={reducedMotion ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ type: 'spring', stiffness: 120, damping: 16 }} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>{t('bioTitle')}</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{workerProfile.bio ?? t('bioEmpty')}</p></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('skillsTitle')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {workerProfile.skills.map((skill) => (<Badge key={skill} variant="secondary">{skill}</Badge>))}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {workerProfile.certifications.map((certification) => (
                <div key={`${certification.name}-${certification.issuer ?? 'issuer'}`} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{certification.name}</p>
                  <p className="text-xs text-muted-foreground">{certification.issuer ?? t('unknownIssuer')}</p>
                  <p className="text-xs text-muted-foreground">{certification.issued_at ?? t('unknownDate')}</p>
                  <p className="mt-1 text-xs">{certification.verified ? t('verified') : t('unverified')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('portfolioTitle')}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {workerProfile.portfolio_items.map((item) => (
              <motion.div
                key={item.id}
                {...(reducedMotion ? {} : { whileHover: { scale: 1.02 } })}
                transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                className="overflow-hidden rounded-lg border"
              >
                {item.image_url ? <img src={item.image_url} alt={t('portfolioAlt')} className="h-28 w-full object-cover" /> : <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">{t('portfolioPlaceholder')}</div>}
                <div className="space-y-1 p-2 text-xs">
                  <p className="font-medium">{item.category}</p>
                  <p className="text-muted-foreground">{item.date ?? t('unknownDate')}</p>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('serviceAreaTitle')}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {t('serviceRadius', { value: workerProfile.service_radius_km.toFixed(0) })}
            </p>
            <iframe title={t('serviceAreaMapTitle')} src={mapImageSrc(point.latitude, point.longitude)} className="h-52 w-full rounded-xl border-0" loading="lazy" />
          </CardContent>
        </Card>
      </motion.section>

      <motion.section initial={reducedMotion ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ type: 'spring', stiffness: 120, damping: 16 }} className="space-y-4">
        <RatingBreakdown
          average={payload.rating_breakdown.average}
          totalReviews={payload.rating_breakdown.total_reviews}
          distribution={payload.rating_breakdown.distribution}
          categories={payload.rating_breakdown.categories}
        />

        <Card>
          <CardHeader><CardTitle>{t('reviewsTitle', { count: payload.reviews.length })}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger><SelectValue placeholder={t('filters.rating')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.allRatings')}</SelectItem>
                  <SelectItem value="5">5*</SelectItem>
                  <SelectItem value="4">4*</SelectItem>
                  <SelectItem value="3">3*</SelectItem>
                  <SelectItem value="2">2*</SelectItem>
                  <SelectItem value="1">1*</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue placeholder={t('filters.category')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.allCategories')}</SelectItem>
                  <SelectItem value="quality">{t('filters.quality')}</SelectItem>
                  <SelectItem value="timeliness">{t('filters.timeliness')}</SelectItem>
                  <SelectItem value="communication">{t('filters.communication')}</SelectItem>
                  <SelectItem value="value">{t('filters.value')}</SelectItem>
                  <SelectItem value="cleanliness">{t('filters.cleanliness')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger><SelectValue placeholder={t('filters.sortBy')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">{t('filters.mostRecent')}</SelectItem>
                  <SelectItem value="helpful">{t('filters.mostHelpful')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {filteredReviews.slice(0, 8).map((review) => (
                <ReviewCard
                  key={review.id}
                  locale={locale}
                  review={{
                    id: review.id,
                    reviewer_name: review.reviewer_name,
                    reviewer_avatar_url: review.reviewer_avatar_url,
                    rating: review.rating,
                    quality_rating: review.quality_rating,
                    timeliness_rating: review.timeliness_rating,
                    communication_rating: review.communication_rating,
                    value_rating: review.value_rating,
                    cleanliness_rating: review.cleanliness_rating,
                    comment: review.comment,
                    photos: review.photos,
                    response: review.response,
                    created_at: review.created_at,
                    helpful_up: review.helpful_up,
                    helpful_down: review.helpful_down
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
};

export default WorkerPublicProfile;
