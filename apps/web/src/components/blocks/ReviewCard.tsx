'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Star, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface ReviewCardData {
  id: string;
  reviewer_name: string;
  reviewer_avatar_url: string | null;
  rating: number;
  quality_rating: number;
  timeliness_rating: number;
  communication_rating: number;
  value_rating: number;
  cleanliness_rating: number;
  comment: string | null;
  photos: ReadonlyArray<string>;
  response: string | null;
  created_at: string;
  helpful_up: number;
  helpful_down: number;
}

interface ReviewCardProps {
  locale: 'en' | 'ar';
  review: ReviewCardData;
}

const formatReviewDate = (value: string, locale: 'en' | 'ar'): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
    dateStyle: 'medium'
  }).format(date);
};

const percentage = (rating: number): number => Math.max(0, Math.min(100, (rating / 5) * 100));

const initialsFromName = (fullName: string): string =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

const StarText = ({ rating }: { rating: number }): React.JSX.Element => (
  <span className="inline-flex items-center gap-0.5 text-amber-500">
    {Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={`review-star-${rating}-${index}`}
        className={cn(
          'h-3.5 w-3.5',
          index < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'
        )}
      />
    ))}
  </span>
);

export const ReviewCard = ({ locale, review }: ReviewCardProps): React.JSX.Element => {
  const t = useTranslations('reviews.card');
  const reducedMotion = useReducedMotion() ?? false;
  const [expanded, setExpanded] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [helpfulUp, setHelpfulUp] = useState(review.helpful_up);
  const [helpfulDown, setHelpfulDown] = useState(review.helpful_down);

  const displayedComment = useMemo(() => {
    if (!review.comment) {
      return '';
    }

    if (expanded || review.comment.length < 180) {
      return review.comment;
    }

    return `${review.comment.slice(0, 180)}...`;
  }, [expanded, review.comment]);

  return (
    <article className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.reviewer_avatar_url ?? undefined} alt={review.reviewer_name} />
            <AvatarFallback>{initialsFromName(review.reviewer_name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{review.reviewer_name}</p>
            <p className="text-xs text-muted-foreground">{formatReviewDate(review.created_at, locale)}</p>
          </div>
        </div>
        <div className="text-end">
          <p className="text-sm font-semibold">{review.rating.toFixed(1)} / 5</p>
          <StarText rating={review.rating} />
        </div>
      </header>

      <div className="space-y-2">
        {[
          { key: 'quality', value: review.quality_rating },
          { key: 'timeliness', value: review.timeliness_rating },
          { key: 'communication', value: review.communication_rating },
          { key: 'value', value: review.value_rating },
          { key: 'cleanliness', value: review.cleanliness_rating }
        ].map((item) => (
          <div key={`${review.id}-${item.key}`} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>{t(`categories.${item.key}`)}</span>
              <span>{item.value.toFixed(1)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={reducedMotion ? false : { width: 0 }}
                whileInView={{ width: `${percentage(item.value)}%` }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ type: 'spring', stiffness: 150, damping: 20 }}
                className="h-full bg-primary"
              />
            </div>
          </div>
        ))}
      </div>

      {review.comment ? (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{displayedComment}</p>
          {review.comment.length > 180 ? (
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={() => {
                setExpanded((previous) => !previous);
              }}
            >
              {expanded ? t('showLess') : t('readMore')}
            </Button>
          ) : null}
        </div>
      ) : null}

      {review.photos.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto">
          {review.photos.map((photo) => (
            <button
              key={photo}
              type="button"
              onClick={() => {
                setActiveImage(photo);
              }}
              className="shrink-0 overflow-hidden rounded-lg border"
            >
              <img src={photo} alt={t('photoAlt')} className="h-20 w-24 object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {review.response ? (
        <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
          <p className="text-xs font-semibold text-muted-foreground">{t('workerResponse')}</p>
          <p className="mt-1 text-foreground">{review.response}</p>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{t('helpfulPrompt')}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1',
              'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => {
              setHelpfulUp((previous) => previous + 1);
            }}
          >
            <ThumbsUp className="h-3.5 w-3.5" /> {helpfulUp}
          </button>
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1',
              'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => {
              setHelpfulDown((previous) => previous + 1);
            }}
          >
            <ThumbsDown className="h-3.5 w-3.5" /> {helpfulDown}
          </button>
        </div>
      </div>

      <Dialog
        open={activeImage !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveImage(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
          {activeImage ? (
            <img src={activeImage} alt={t('photoAlt')} className="max-h-[80vh] w-full rounded-xl object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </article>
  );
};

export default ReviewCard;
