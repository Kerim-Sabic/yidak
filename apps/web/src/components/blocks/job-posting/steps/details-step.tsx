'use client';

import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import type { JobPostFormValues } from '@/components/blocks/job-posting/types';
import type { UseFormReturn } from 'react-hook-form';

import { buildAiDescriptionOptions } from '@/components/blocks/job-posting/helpers';
import { PhotoUpload } from '@/components/blocks/PhotoUpload';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface DetailsStepProps {
  form: UseFormReturn<JobPostFormValues>;
}

export const DetailsStep = ({ form }: DetailsStepProps): React.JSX.Element => {
  const t = useTranslations('customer.jobs.new');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [briefText, setBriefText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiOptions, setAiOptions] = useState<ReadonlyArray<string>>([]);

  const title = form.watch('title');
  const description = form.watch('description');
  const photos = form.watch('photos');
  const preferredGender = form.watch('preferred_gender');

  const canGenerate = briefText.trim().length >= 10;
  const titleCountLabel = useMemo(
    () => `${title.length}/200`,
    [title.length]
  );
  const descriptionCountLabel = useMemo(
    () => `${description.length}/5000`,
    [description.length]
  );

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t('steps.details.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('steps.details.subtitle')}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="job-title">{t('form.title')}</Label>
        <Input
          id="job-title"
          value={title}
          placeholder={t('form.titlePlaceholder')}
          onChange={(event) => { form.setValue('title', event.target.value, { shouldValidate: true }); }}
        />
        <p className="text-end text-xs text-muted-foreground">{titleCountLabel}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="job-description">{t('form.description')}</Label>
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => { setDrawerOpen(true); }}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {t('form.aiAssist')}
          </Button>
        </div>

        <Textarea
          id="job-description"
          rows={6}
          value={description}
          placeholder={t('form.descriptionPlaceholder')}
          onChange={(event) => { form.setValue('description', event.target.value, { shouldValidate: true }); }}
        />
        <p className="text-end text-xs text-muted-foreground">{descriptionCountLabel}</p>
      </div>

      <PhotoUpload
        value={photos}
        onChange={(next) => { form.setValue('photos', next, { shouldValidate: true }); }}
        labels={{
          title: t('form.photoUploadTitle'),
          subtitle: t('form.photoUploadSubtitle'),
          uploading: t('form.photoUploading'),
          maxReached: t('form.photoMaxReached'),
          remove: t('form.photoRemove'),
          photoAlt: t('form.photoAlt')
        }}
      />

      <div className="space-y-2">
        <Label>{t('form.preferenceLabel')}</Label>
        <ToggleGroup
          type="single"
          value={preferredGender}
          onValueChange={(next) => {
            if (next === 'any' || next === 'male' || next === 'female') {
              form.setValue('preferred_gender', next, { shouldValidate: true });
            }
          }}
          className="grid grid-cols-3"
        >
          <ToggleGroupItem value="any">{t('form.preferenceAny')}</ToggleGroupItem>
          <ToggleGroupItem value="male">{t('form.preferenceMale')}</ToggleGroupItem>
          <ToggleGroupItem value="female">{t('form.preferenceFemale')}</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-2xl space-y-4 p-4">
            <DrawerHeader>
              <DrawerTitle>{t('form.aiDrawerTitle')}</DrawerTitle>
              <DrawerDescription>{t('form.aiDrawerDescription')}</DrawerDescription>
            </DrawerHeader>

            <Textarea value={briefText} rows={3} onChange={(event) => { setBriefText(event.target.value); }} />

            <Button
              type="button"
              disabled={!canGenerate || isGenerating}
              onClick={() => {
                void (async () => {
                  setIsGenerating(true);
                  await new Promise((resolve) => window.setTimeout(resolve, 450));
                  setAiOptions(buildAiDescriptionOptions(briefText));
                  setIsGenerating(false);
                })();
              }}
            >
              {t('form.aiGenerate')}
            </Button>

            {isGenerating ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                {aiOptions.map((option) => (
                  <button
                    type="button"
                    key={option}
                    className="w-full rounded-lg border border-border bg-card p-3 text-start text-sm hover:border-primary/50"
                    onClick={() => {
                      form.setValue('description', option, { shouldValidate: true });
                      setDrawerOpen(false);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
};

export default DetailsStep;
