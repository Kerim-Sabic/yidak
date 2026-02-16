import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';

import { DashboardSkeleton } from '@/components/blocks/skeletons';

const WorkerEarningsPanel = dynamic(
  async () =>
    import('@/components/blocks/worker-earnings-panel').then((mod) => mod.WorkerEarningsPanel),
  {
    loading: () => <DashboardSkeleton />,
  },
);

interface WorkerEarningsPageProps {
  params: Promise<{ locale: string }>;
}

const WorkerEarningsPage = async ({
  params,
}: WorkerEarningsPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'worker.earnings' });

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>
      <WorkerEarningsPanel locale={locale} />
    </section>
  );
};

export default WorkerEarningsPage;
