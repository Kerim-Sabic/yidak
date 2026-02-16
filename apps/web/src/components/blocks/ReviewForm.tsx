'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Camera,
  CircleDollarSign,
  Clock3,
  MessageSquare,
  Sparkles,
  Star,
  Upload,
  type LucideIcon
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';

import { SuccessBurst } from '@/components/blocks/auth/success-burst';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';

type ReviewMode = 'customer' | 'worker';

interface ReviewFormProps {
  locale: 'en' | 'ar';
  jobId: string;
  mode: ReviewMode;
  onSubmitted?: () => void;
  onSkip?: () => void;
}

interface RatingRowProps {
  label: string;
  icon: LucideIcon;
  value: number;
  onChange: (next: number) => void;
}

const maxPhotos = 5;

const calculateAverage = (values: ReadonlyArray<number>): number => {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
};

const RatingRow = ({ label, icon, value, onChange }: RatingRowProps): React.JSX.Element => {
  const reducedMotion = useReducedMotion() ?? false;
  const [hoverValue, setHoverValue] = useState(0);
  const activeValue = hoverValue > 0 ? hoverValue : value;
  const Icon = icon;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
      <p className="text-sm font-medium">
        <span className="inline-flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </span>
      </p>
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => {
          setHoverValue(0);
        }}
      >
        {Array.from({ length: 5 }).map((_, index) => {
          const current = index + 1;
          const active = current <= activeValue;
          return (
            <motion.button
              key={`${label}-star-${current}`}
              type="button"
              {...(reducedMotion ? {} : { whileHover: { scale: 1.1 }, whileTap: { scale: 0.95 } })}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              onMouseEnter={() => {
                setHoverValue(current);
              }}
              onClick={() => {
                onChange(current);
              }}
              className="rounded-md p-1"
              aria-label={`${label} ${current}`}
            >
              <Star
                className={cn(
                  'h-5 w-5 transition-colors',
                  active ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'
                )}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

const parseTip = (input: string): number | null => {
  const parsed = Number(input);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

export const ReviewForm = ({
  locale,
  jobId,
  mode,
  onSubmitted,
  onSkip
}: ReviewFormProps): React.JSX.Element => {
  void locale;
  const t = useTranslations('reviews.form');
  const reducedMotion = useReducedMotion() ?? false;
  const createReview = trpc.review.create.useMutation();

  const [overallRating, setOverallRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState<ReadonlyArray<string>>([]);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [customTipInput, setCustomTipInput] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const customerAverage = useMemo(() => {
    return calculateAverage([
      qualityRating,
      timelinessRating,
      communicationRating,
      valueRating,
      cleanlinessRating
    ]);
  }, [cleanlinessRating, communicationRating, qualityRating, timelinessRating, valueRating]);

  const effectiveOverall = mode === 'customer' ? customerAverage : overallRating;
  const tipAmount = selectedTip ?? parseTip(customTipInput);

  const handleAddPhotos = (event: ChangeEvent<HTMLInputElement>): void => {
    const fileList = event.target.files;
    if (!fileList) {
      return;
    }

    const files = Array.from(fileList);
    const remaining = Math.max(0, maxPhotos - photos.length);
    const nextUrls = files.slice(0, remaining).map((file) => URL.createObjectURL(file));
    setPhotos((previous) => [...previous, ...nextUrls]);
    event.target.value = '';
  };

  const handleRemovePhoto = (photoUrl: string): void => {
    URL.revokeObjectURL(photoUrl);
    setPhotos((previous) => previous.filter((item) => item !== photoUrl));
  };

  const handleSkip = (): void => {
    const key = `pending-review:${jobId}`;
    localStorage.setItem(
      key,
      JSON.stringify({
        mode,
        skipped_at: new Date().toISOString()
      })
    );
    onSkip?.();
  };

  const handleSubmit = async (): Promise<void> => {
    setErrorText(null);

    if (effectiveOverall < 1) {
      setErrorText(t('errors.ratingRequired'));
      return;
    }

    if (reviewText.trim().length < 20) {
      setErrorText(t('errors.reviewTooShort'));
      return;
    }

    const communication = communicationRating > 0 ? communicationRating : Math.round(effectiveOverall);
    const quality = qualityRating > 0 ? qualityRating : Math.round(effectiveOverall);
    const timeliness = timelinessRating > 0 ? timelinessRating : Math.round(effectiveOverall);
    const value = valueRating > 0 ? valueRating : Math.round(effectiveOverall);
    const cleanliness = cleanlinessRating > 0 ? cleanlinessRating : Math.round(effectiveOverall);

    try {
      await createReview.mutateAsync({
        job_id: jobId,
        rating: Math.round(effectiveOverall),
        communication_rating: communication,
        quality_rating: quality,
        timeliness_rating: timeliness,
        value_rating: value,
        cleanliness_rating: cleanliness,
        comment: reviewText.trim(),
        photos: photos.slice(0, maxPhotos),
        tip_amount: tipAmount ?? undefined
      });

      setShowSuccess(true);
      toast.success(t('messages.success'));
      window.setTimeout(() => {
        onSubmitted?.();
      }, 400);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('messages.error');
      setErrorText(message);
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">{t(mode === 'customer' ? 'titleCustomer' : 'titleWorker')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === 'worker' ? (
          <RatingRow label={t('rows.overall')} icon={Star} value={overallRating} onChange={setOverallRating} />
        ) : (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-sm text-muted-foreground">{t('overallAuto')}</p>
            <p className="text-2xl font-semibold text-amber-600">{effectiveOverall.toFixed(1)} / 5</p>
          </div>
        )}

        {mode === 'customer' ? (
          <>
            <RatingRow label={t('rows.quality')} icon={Star} value={qualityRating} onChange={setQualityRating} />
            <RatingRow
              label={t('rows.timeliness')}
              icon={Clock3}
              value={timelinessRating}
              onChange={setTimelinessRating}
            />
            <RatingRow
              label={t('rows.communication')}
              icon={MessageSquare}
              value={communicationRating}
              onChange={setCommunicationRating}
            />
            <RatingRow
              label={t('rows.value')}
              icon={CircleDollarSign}
              value={valueRating}
              onChange={setValueRating}
            />
            <RatingRow
              label={t('rows.cleanliness')}
              icon={Sparkles}
              value={cleanlinessRating}
              onChange={setCleanlinessRating}
            />
          </>
        ) : (
          <RatingRow
            label={t('rows.communication')}
            icon={MessageSquare}
            value={communicationRating}
            onChange={setCommunicationRating}
          />
        )}

        <div className="space-y-2">
          <Label htmlFor={`review-text-${jobId}`}>{t('reviewLabel')}</Label>
          <Textarea
            id={`review-text-${jobId}`}
            value={reviewText}
            maxLength={1000}
            onChange={(event) => {
              setReviewText(event.target.value);
            }}
            placeholder={t('reviewPlaceholder')}
          />
          <p className="text-xs text-muted-foreground">{reviewText.length}/1000</p>
        </div>

        <div className="space-y-2">
          <Label>{t('photoLabel')}</Label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
            <Upload className="h-4 w-4" />
            {t('photoAction')}
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />
          </label>
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {photos.map((photo) => (
                <button
                  key={photo}
                  type="button"
                  onClick={() => {
                    handleRemovePhoto(photo);
                  }}
                  className="group relative overflow-hidden rounded-lg border"
                >
                  <img src={photo} alt={t('photoPreviewAlt')} className="h-24 w-full object-cover" />
                  <span className="absolute inset-0 hidden items-center justify-center bg-black/45 text-xs text-white group-hover:flex">
                    {t('removePhoto')}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {mode === 'customer' ? (
          <div className="space-y-2">
            <Label>{t('tipLabel')}</Label>
            <div className="flex flex-wrap gap-2">
              {[10, 20, 50].map((amount) => (
                <Button
                  key={`tip-${amount}`}
                  type="button"
                  variant={selectedTip === amount ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedTip(amount);
                    setCustomTipInput('');
                  }}
                >
                  {t('tipPreset', { amount })}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <Input
                inputMode="decimal"
                value={customTipInput}
                onChange={(event) => {
                  setSelectedTip(null);
                  setCustomTipInput(event.target.value);
                }}
                placeholder={t('tipCustomPlaceholder')}
              />
            </div>
          </div>
        ) : null}

        {errorText ? <p className="text-sm text-destructive">{errorText}</p> : null}

        <div className="flex flex-wrap items-center gap-2">
          <motion.div
            {...(reducedMotion ? {} : { whileTap: { scale: 0.98 } })}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className="flex-1"
          >
            <Button
              className="w-full"
              disabled={createReview.isPending}
              onClick={() => {
                void handleSubmit();
              }}
            >
              {createReview.isPending ? t('submitLoading') : t('submit')}
            </Button>
          </motion.div>
          <Button type="button" variant="ghost" onClick={handleSkip}>
            {t('skip')}
          </Button>
        </div>

        <SuccessBurst active={showSuccess} />
      </CardContent>
    </Card>
  );
};

export default ReviewForm;
