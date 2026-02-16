import { getTranslations } from 'next-intl/server';

import { WorkerDashboardOverview } from '@/components/blocks/worker-dashboard-overview';

interface WorkerDashboardPageProps {
  params: Promise<{ locale: string }>;
}

const WorkerDashboardPage = async ({
  params,
}: WorkerDashboardPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'worker.dashboard' });

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <WorkerDashboardOverview locale={locale} />
    </section>
  );
};

export default WorkerDashboardPage;
