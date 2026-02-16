'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import type { JobPostFormValues } from '@/components/blocks/job-posting/types';
import type { UseFormReturn } from 'react-hook-form';

import { GCC_CITIES } from '@/components/blocks/job-posting/constants';
import { LocationPicker } from '@/components/blocks/LocationPicker';

interface LocationStepProps {
  form: UseFormReturn<JobPostFormValues>;
}

export const LocationStep = ({ form }: LocationStepProps): React.JSX.Element => {
  const t = useTranslations('customer.jobs.new');
  const location = form.watch('location');

  const cityOptions = useMemo(() => GCC_CITIES[location.country], [location.country]);

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t('steps.location.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('steps.location.subtitle')}</p>
      </div>

      <LocationPicker
        value={location}
        cityOptions={cityOptions}
        countryOptions={[
          { code: 'AE', label: t('countries.ae') },
          { code: 'SA', label: t('countries.sa') },
          { code: 'QA', label: t('countries.qa') },
          { code: 'BH', label: t('countries.bh') },
          { code: 'KW', label: t('countries.kw') },
          { code: 'OM', label: t('countries.om') }
        ]}
        onChange={(next) => { form.setValue('location', next, { shouldValidate: true }); }}
        labels={{
          searchPlaceholder: t('form.locationSearchPlaceholder'),
          useCurrentLocation: t('form.useCurrentLocation'),
          addressLabel: t('form.addressLabel'),
          cityLabel: t('form.cityLabel'),
          areaLabel: t('form.areaLabel'),
          buildingLabel: t('form.buildingLabel'),
          countryLabel: t('form.countryLabel'),
          geolocationError: t('errors.geolocation')
        }}
      />
    </section>
  );
};

export default LocationStep;
