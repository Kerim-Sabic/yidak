'use client';

import { formatCurrency } from '@yidak/utils';
import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { JobPostFormValues } from '@/components/blocks/job-posting/types';
import type { UseFormReturn } from 'react-hook-form';

import { JOB_CATEGORIES } from '@/components/blocks/job-posting/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ReviewStepProps {
  form: UseFormReturn<JobPostFormValues>;
  onEditStep: (step: number) => void;
}

const mapSrc = (latitude: number, longitude: number): string =>
  `https://maps.google.com/maps?q=${latitude},${longitude}&z=12&output=embed`;

export const ReviewStep = ({ form, onEditStep }: ReviewStepProps): React.JSX.Element => {
  const t = useTranslations('customer.jobs.new');

  const values = form.getValues();
  const category = JOB_CATEGORIES.find((item) => item.id === values.category_id);

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t('steps.review.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('steps.review.subtitle')}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t('review.summary')}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => { onEditStep(1); }}>
            {t('review.editCategory')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="font-semibold">{t('review.category')}:</span>{' '}
            {category ? t(`categories.${category.slug}.name`) : '-'}
          </p>
          <p>
            <span className="font-semibold">{t('review.title')}:</span> {values.title}
          </p>
          <p>
            <span className="font-semibold">{t('review.description')}:</span> {values.description}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t('review.photos')}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => { onEditStep(2); }}>
            {t('review.editDetails')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto">
            {values.photos.length > 0 ? (
              values.photos.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt={t('review.photoAlt')}
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">{t('review.noPhotos')}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t('review.location')}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => { onEditStep(3); }}>
            {t('review.editLocation')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <iframe title="Location preview" src={mapSrc(values.location.latitude, values.location.longitude)} className="h-40 w-full rounded-lg border-0" loading="lazy" />
          <p className="text-sm text-muted-foreground">{values.location.address}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t('review.pricing')}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => { onEditStep(4); }}>
            {t('review.editBudget')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">{t('review.budget')}:</span>{' '}
            {formatCurrency(values.budget_min, values.location.country)} -{' '}
            {formatCurrency(values.budget_max, values.location.country)}
          </p>
          <p className="text-muted-foreground">{t('review.platformFeeNote')}</p>
          <p className="text-muted-foreground">{t('review.escrowNote')}</p>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-500/10 px-3 py-1 text-emerald-700">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {t('review.shariahBadge')}
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-56 text-xs">{t('review.shariahTooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardContent>
      </Card>

      <label className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-sm">
        <input
          type="checkbox"
          checked={values.accepted_terms}
          onChange={(event) => { form.setValue('accepted_terms', event.target.checked, { shouldValidate: true }); }}
          className="mt-1 h-4 w-4 rounded border-border"
        />
        <span>
          {t('review.termsPrefix')} <a className="font-semibold underline" href="#">{t('review.termsLink')}</a>
        </span>
      </label>
    </section>
  );
};

export default ReviewStep;
