import { JobIdSchema } from '@yidak/types';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { JobDetailContent } from '@/components/blocks/job-detail-content';
import { createClient } from '@/lib/supabase/server';

interface JobDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const readString = (value: unknown, key: string): string => {
  if (!isObject(value)) {
    return '';
  }

  const result = Reflect.get(value, key);
  return typeof result === 'string' ? result : '';
};

const readNumber = (value: unknown, key: string): number => {
  if (!isObject(value)) {
    return 0;
  }

  const result = Reflect.get(value, key);
  return typeof result === 'number' ? result : 0;
};

const readStringArray = (value: unknown, key: string): string[] => {
  if (!isObject(value)) {
    return [];
  }

  const result = Reflect.get(value, key);
  return Array.isArray(result)
    ? result.filter((item): item is string => typeof item === 'string')
    : [];
};

const parsePoint = (raw: string): { latitude: number; longitude: number } => {
  const match = /POINT\((-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/.exec(raw);
  if (!match) {
    return { latitude: 25.2048, longitude: 55.2708 };
  }

  const lon = Number(match[1]);
  const lat = Number(match[2]);
  return {
    latitude: Number.isFinite(lat) ? lat : 25.2048,
    longitude: Number.isFinite(lon) ? lon : 55.2708,
  };
};

const JobDetailPage = async ({ params }: JobDetailPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale, id } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'customer.jobs.detail' });

  const parsed = JobIdSchema.safeParse(id);
  if (!parsed.success) {
    notFound();
  }

  const supabase = await createClient();
  const { data } = await supabase.from('jobs').select('*').eq('id', parsed.data).single();

  const row: unknown = data;

  if (!isObject(row)) {
    notFound();
  }

  const locationText = readString(row, 'location');
  const point = parsePoint(locationText);

  return (
    <section className="space-y-4">
      <h1 className="text-foreground text-2xl font-bold">{t('title', { id })}</h1>
      <JobDetailContent
        locale={locale}
        title={readString(row, 'title')}
        status={readString(row, 'status')}
        categoryName={readString(row, 'category_name') || t('fallback.category')}
        description={readString(row, 'description')}
        photos={readStringArray(row, 'photos')}
        budgetMin={readNumber(row, 'budget_min')}
        budgetMax={readNumber(row, 'budget_max')}
        country={(() => {
          const value = readString(row, 'country');
          if (
            value === 'SA' ||
            value === 'QA' ||
            value === 'BH' ||
            value === 'KW' ||
            value === 'OM'
          ) {
            return value;
          }

          return 'AE';
        })()}
        urgency={readString(row, 'urgency')}
        createdAt={readString(row, 'created_at')}
        city={readString(row, 'city')}
        address={readString(row, 'address')}
        latitude={point.latitude}
        longitude={point.longitude}
      />
    </section>
  );
};

export default JobDetailPage;
