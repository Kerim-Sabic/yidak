'use client';

import { JobIdSchema } from '@yidak/types';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { ReviewCard } from '@/components/blocks/ReviewCard';
import { ReviewForm } from '@/components/blocks/ReviewForm';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc/client';

type ReviewMode = 'customer' | 'worker';

interface JobReviewSectionProps {
  locale: 'en' | 'ar';
  jobId: string;
  status: string;
  mode: ReviewMode;
}

const reviewableStatuses = new Set(['completed', 'reviewed']);

const fallbackUuid = '00000000-0000-4000-8000-000000000000';

export const JobReviewSection = ({
  locale,
  jobId,
  status,
  mode
}: JobReviewSectionProps): React.JSX.Element | null => {
  const t = useTranslations('reviews.section');
  const { profile } = useAuth();
  const parsed = JobIdSchema.safeParse(jobId);

  const resolvedJobId = parsed.success ? parsed.data : fallbackUuid;
  const reviewsQuery = trpc.review.getForJob.useQuery(resolvedJobId, {
    enabled: parsed.success && reviewableStatuses.has(status)
  });

  const myReview = useMemo(() => {
    if (!profile || !reviewsQuery.data) {
      return null;
    }

    return reviewsQuery.data.find((review) => review.reviewer_id === profile.id) ?? null;
  }, [profile, reviewsQuery.data]);

  if (!reviewableStatuses.has(status) || !parsed.success) {
    return null;
  }

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      {!myReview ? (
        <ReviewForm
          locale={locale}
          jobId={resolvedJobId}
          mode={mode}
          onSubmitted={() => {
            void reviewsQuery.refetch();
          }}
          onSkip={() => {
            void reviewsQuery.refetch();
          }}
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-emerald-600">{t('alreadyReviewed')}</p>
          <ReviewCard
            locale={locale}
            review={{
              id: myReview.id,
              reviewer_name: myReview.reviewer?.full_name ?? t('anonymous'),
              reviewer_avatar_url: myReview.reviewer?.avatar_url ?? null,
              rating: myReview.rating,
              quality_rating: myReview.quality_rating,
              timeliness_rating: myReview.timeliness_rating,
              communication_rating: myReview.communication_rating,
              value_rating: myReview.value_rating,
              cleanliness_rating: myReview.cleanliness_rating,
              comment: myReview.comment,
              photos: myReview.photos,
              response: myReview.response,
              created_at: myReview.created_at,
              helpful_up: myReview.helpful_up,
              helpful_down: myReview.helpful_down
            }}
          />
        </div>
      )}
    </section>
  );
};

export default JobReviewSection;
