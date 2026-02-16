'use client';

import { formatCurrency, getCurrencySymbol } from '@yidak/utils';
import { CalendarDays } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import type { JobPostFormValues } from '@/components/blocks/job-posting/types';
import type { UseFormReturn } from 'react-hook-form';

import { BudgetSlider } from '@/components/blocks/BudgetSlider';
import { getBudgetSuggestion, JOB_CATEGORIES, URGENCY_TIME_LIMIT } from '@/components/blocks/job-posting/constants';
import { UrgencySelector, type UrgencyOption } from '@/components/blocks/UrgencySelector';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const toIsoDate = (date: Date): string => date.toISOString().split('T')[0] ?? '';

const timeOptions = (): string[] => {
  const values: string[] = [];

  for (let hour = 0; hour < 24; hour += 1) {
    values.push(`${hour.toString().padStart(2, '0')}:00`);
    values.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  return values;
};

interface BudgetStepProps {
  form: UseFormReturn<JobPostFormValues>;
}

export const BudgetStep = ({ form }: BudgetStepProps): React.JSX.Element => {
  const t = useTranslations('customer.jobs.new');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const country = form.watch('location.country');
  const city = form.watch('location.city');
  const categoryId = form.watch('category_id');
  const budgetMin = form.watch('budget_min');
  const budgetMax = form.watch('budget_max');
  const urgency = form.watch('urgency');
  const scheduleMode = form.watch('schedule_mode');
  const scheduledDate = form.watch('scheduled_date');
  const scheduledTime = form.watch('scheduled_time');

  const category = JOB_CATEGORIES.find((item) => item.id === categoryId);
  const suggestion = getBudgetSuggestion(category?.slug ?? 'handyman-general', city);

  const urgencyOptions: ReadonlyArray<UrgencyOption> = [
    {
      value: 'flexible',
      icon: '??',
      label: t('urgency.flexible'),
      timeLimit: URGENCY_TIME_LIMIT.flexible,
      surchargeLabel: t('urgency.noSurcharge')
    },
    {
      value: 'normal',
      icon: '?',
      label: t('urgency.normal'),
      timeLimit: URGENCY_TIME_LIMIT.normal,
      surchargeLabel: t('urgency.noSurcharge')
    },
    {
      value: 'urgent',
      icon: '??',
      label: t('urgency.urgent'),
      timeLimit: URGENCY_TIME_LIMIT.urgent,
      surchargeLabel: t('urgency.moderateSurcharge')
    },
    {
      value: 'emergency',
      icon: '??',
      label: t('urgency.emergency'),
      timeLimit: URGENCY_TIME_LIMIT.emergency,
      surchargeLabel: t('urgency.highSurcharge')
    }
  ];

  const currencyLabel = `${getCurrencySymbol(country)} ${country}`;
  const suggestionText = `${formatCurrency(suggestion.min, country)} - ${formatCurrency(suggestion.max, country)}`;
  const times = useMemo(() => timeOptions(), []);

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t('steps.budget.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('steps.budget.subtitle')}</p>
      </div>

      <BudgetSlider
        value={[budgetMin, budgetMax]}
        minLimit={50}
        maxLimit={20000}
        currencyLabel={currencyLabel}
        minLabel={t('form.budgetMin')}
        maxLabel={t('form.budgetMax')}
        suggestionLabel={t('form.suggestedRange')}
        suggestionText={suggestionText}
        onChange={(next) => {
          form.setValue('budget_min', next[0], { shouldValidate: true });
          form.setValue('budget_max', next[1], { shouldValidate: true });
        }}
      />

      <div className="space-y-3">
        <p className="text-sm font-semibold">{t('form.urgencyLabel')}</p>
        <UrgencySelector
          value={urgency}
          options={urgencyOptions}
          onChange={(next) => { form.setValue('urgency', next, { shouldValidate: true }); }}
        />
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">{t('form.scheduleLabel')}</p>

        <ToggleGroup
          type="single"
          value={scheduleMode}
          onValueChange={(next) => {
            if (next === 'asap' || next === 'scheduled') {
              form.setValue('schedule_mode', next, { shouldValidate: true });
            }
          }}
          className="grid grid-cols-2"
        >
          <ToggleGroupItem value="asap">{t('form.scheduleAsap')}</ToggleGroupItem>
          <ToggleGroupItem value="scheduled">{t('form.scheduleLater')}</ToggleGroupItem>
        </ToggleGroup>

        {scheduleMode === 'scheduled' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="justify-start gap-2">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  {scheduledDate || t('form.pickDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledDate ? new Date(scheduledDate) : undefined}
                  onSelect={(next) => {
                    if (!next) {
                      return;
                    }

                    form.setValue('scheduled_date', toIsoDate(next), { shouldValidate: true });
                    setCalendarOpen(false);
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>

            <Input
              list="schedule-time-options"
              value={scheduledTime}
              placeholder={t('form.pickTime')}
              onChange={(event) => { form.setValue('scheduled_time', event.target.value, { shouldValidate: true }); }}
            />
            <datalist id="schedule-time-options">
              {times.map((time) => (
                <option key={time} value={time} />
              ))}
            </datalist>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default BudgetStep;
