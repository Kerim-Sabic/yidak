'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useEffect, useMemo, useState } from 'react';
import { useForm, type Path } from 'react-hook-form';
import { toast } from 'sonner';

import type { JobPostFormValues } from '@/components/blocks/job-posting/types';

import { JOB_POSTING_DEFAULTS } from '@/components/blocks/job-posting/constants';
import { draftStorageKey, getStepDirection } from '@/components/blocks/job-posting/helpers';
import { JobPostFormSchema, toCreateJobInput } from '@/components/blocks/job-posting/schemas';
import { BudgetStep } from '@/components/blocks/job-posting/steps/budget-step';
import { CategoryStep } from '@/components/blocks/job-posting/steps/category-step';
import { DetailsStep } from '@/components/blocks/job-posting/steps/details-step';
import { LocationStep } from '@/components/blocks/job-posting/steps/location-step';
import { ReviewStep } from '@/components/blocks/job-posting/steps/review-step';
import { SuccessConfetti } from '@/components/blocks/job-posting/success-confetti';
import { StepIndicator } from '@/components/blocks/StepIndicator';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/client';

interface JobPostingFlowProps {
  locale: 'en' | 'ar';
}

const slideVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -24 : 24 })
};

const normalizeStep = (value: number | null): number => {
  if (!value) {
    return 1;
  }

  return Math.min(5, Math.max(1, value));
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const readString = (value: Record<string, unknown>, key: string, fallback: string): string => {
  const result = Reflect.get(value, key);
  return typeof result === 'string' ? result : fallback;
};

const readNumber = (value: Record<string, unknown>, key: string, fallback: number): number => {
  const result = Reflect.get(value, key);
  return typeof result === 'number' ? result : fallback;
};

const readBoolean = (value: Record<string, unknown>, key: string, fallback: boolean): boolean => {
  const result = Reflect.get(value, key);
  return typeof result === 'boolean' ? result : fallback;
};

const readStringArray = (value: Record<string, unknown>, key: string): string[] => {
  const result = Reflect.get(value, key);
  return Array.isArray(result) ? result.filter((item): item is string => typeof item === 'string') : [];
};

const toValues = (value: unknown): JobPostFormValues => {
  if (!isObject(value)) {
    return JOB_POSTING_DEFAULTS;
  }

  const location = isObject(value.location) ? value.location : {};
  const preferredGender = readString(value, 'preferred_gender', JOB_POSTING_DEFAULTS.preferred_gender);
  const urgency = readString(value, 'urgency', JOB_POSTING_DEFAULTS.urgency);
  const scheduleMode = readString(value, 'schedule_mode', JOB_POSTING_DEFAULTS.schedule_mode);
  const country = readString(location, 'country', JOB_POSTING_DEFAULTS.location.country);

  const normalizedGender =
    preferredGender === 'male' || preferredGender === 'female' ? preferredGender : 'any';
  const normalizedUrgency =
    urgency === 'flexible' || urgency === 'urgent' || urgency === 'emergency' ? urgency : 'normal';
  const normalizedSchedule = scheduleMode === 'scheduled' ? 'scheduled' : 'asap';
  const normalizedCountry =
    country === 'SA' || country === 'QA' || country === 'BH' || country === 'KW' || country === 'OM'
      ? country
      : 'AE';

  return {
    category_id: readString(value, 'category_id', JOB_POSTING_DEFAULTS.category_id),
    title: readString(value, 'title', JOB_POSTING_DEFAULTS.title),
    description: readString(value, 'description', JOB_POSTING_DEFAULTS.description),
    photos: readStringArray(value, 'photos'),
    preferred_gender: normalizedGender,
    location: {
      latitude: readNumber(location, 'latitude', JOB_POSTING_DEFAULTS.location.latitude),
      longitude: readNumber(location, 'longitude', JOB_POSTING_DEFAULTS.location.longitude),
      address: readString(location, 'address', JOB_POSTING_DEFAULTS.location.address),
      city: readString(location, 'city', JOB_POSTING_DEFAULTS.location.city),
      area: readString(location, 'area', JOB_POSTING_DEFAULTS.location.area),
      building: readString(location, 'building', JOB_POSTING_DEFAULTS.location.building),
      country: normalizedCountry
    },
    budget_min: readNumber(value, 'budget_min', JOB_POSTING_DEFAULTS.budget_min),
    budget_max: readNumber(value, 'budget_max', JOB_POSTING_DEFAULTS.budget_max),
    urgency: normalizedUrgency,
    schedule_mode: normalizedSchedule,
    scheduled_date: readString(value, 'scheduled_date', JOB_POSTING_DEFAULTS.scheduled_date),
    scheduled_time: readString(value, 'scheduled_time', JOB_POSTING_DEFAULTS.scheduled_time),
    accepted_terms: readBoolean(value, 'accepted_terms', JOB_POSTING_DEFAULTS.accepted_terms)
  };
};

const fieldsByStep: Readonly<Record<number, ReadonlyArray<Path<JobPostFormValues>>>> = {
  1: ['category_id'],
  2: ['title', 'description'],
  3: ['location.address', 'location.city', 'location.country'],
  4: ['budget_min', 'budget_max', 'urgency', 'schedule_mode'],
  5: ['accepted_terms']
};

export const JobPostingFlow = ({ locale }: JobPostingFlowProps): React.JSX.Element => {
  const t = useTranslations('customer.jobs.new');
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [queryStep, setQueryStep] = useQueryState('step', parseAsInteger.withDefault(1));
  const currentStep = normalizeStep(queryStep);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<JobPostFormValues>({
    resolver: zodResolver(JobPostFormSchema),
    defaultValues: JOB_POSTING_DEFAULTS,
    mode: 'onChange'
  });

  const createJob = trpc.job.create.useMutation();
  const draftKey = draftStorageKey(locale);

  useEffect(() => {
    const stored = window.localStorage.getItem(draftKey);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      form.reset(toValues(parsed));
    } catch {
      return;
    }
  }, [draftKey, form]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const snapshot = form.getValues();
      window.localStorage.setItem(draftKey, JSON.stringify(snapshot));
    }, 30_000);

    return () => { window.clearInterval(timer); };
  }, [draftKey, form]);

  const stepLabels = useMemo(
    () => [
      t('steps.labels.category'),
      t('steps.labels.details'),
      t('steps.labels.location'),
      t('steps.labels.budget'),
      t('steps.labels.review')
    ],
    [t]
  );

  const goToStep = async (nextStep: number): Promise<void> => {
    const normalized = normalizeStep(nextStep);
    setDirection(getStepDirection(normalized, currentStep));
    await setQueryStep(normalized);
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    const fields = [...(fieldsByStep[currentStep] ?? [])];
    const scheduleMode = form.getValues('schedule_mode');

    if (currentStep === 4 && scheduleMode === 'scheduled') {
      fields.push('scheduled_date', 'scheduled_time');
    }

    return form.trigger(fields, { shouldFocus: true });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = toCreateJobInput(values);
      const created = await createJob.mutateAsync(payload);
      setShowSuccess(true);
      window.localStorage.removeItem(draftKey);
      toast.success(t('messages.postedSuccess'));
      window.setTimeout(() => {
        router.push(`/${locale}/customer/jobs/${created.job.id}`);
      }, 900);
    } catch {
      toast.error(t('errors.submitFailed'));
    }
  });

  return (
    <form
      className="relative space-y-6"
      onSubmit={(event) => {
        void onSubmit(event);
      }}
    >
      <StepIndicator currentStep={currentStep} steps={stepLabels} />

      <AnimatePresence initial={false} mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial={reducedMotion ? false : 'enter'}
          animate="center"
          exit="exit"
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 120, damping: 14 }
          }
        >
          {currentStep === 1 ? <CategoryStep value={form.watch('category_id')} onChange={(next) => { form.setValue('category_id', next, { shouldValidate: true }); }} /> : null}
          {currentStep === 2 ? <DetailsStep form={form} /> : null}
          {currentStep === 3 ? <LocationStep form={form} /> : null}
          {currentStep === 4 ? <BudgetStep form={form} /> : null}
          {currentStep === 5 ? <ReviewStep form={form} onEditStep={(step) => { void goToStep(step); }} /> : null}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={currentStep === 1 || createJob.isPending}
          onClick={() => void goToStep(currentStep - 1)}
        >
          {t('actions.back')}
        </Button>

        {currentStep < 5 ? (
          <Button
            type="button"
            disabled={createJob.isPending}
            onClick={() => {
              void (async () => {
                const valid = await validateCurrentStep();
                if (!valid) {
                  toast.error(t('errors.fixFields'));
                  return;
                }

                await goToStep(currentStep + 1);
              })();
            }}
          >
            {t('actions.next')}
          </Button>
        ) : (
          <Button type="submit" disabled={createJob.isPending} className="w-full sm:w-auto">
            {createJob.isPending ? t('actions.posting') : t('actions.post')}
          </Button>
        )}
      </div>

      {showSuccess ? <SuccessConfetti label={t('messages.postedSuccess')} /> : null}
    </form>
  );
};

export default JobPostingFlow;
