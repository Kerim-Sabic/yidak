import { getTranslations } from 'next-intl/server';

import { WorkerJobsFeed } from '@/components/blocks/worker-jobs-feed';

interface WorkerJobsPageProps {
  params: Promise<{ locale: string }>;
}

const WorkerJobsPage = async ({ params }: WorkerJobsPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'worker.jobs' });

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <WorkerJobsFeed locale={locale} />
    </section>
  );
};

export default WorkerJobsPage;
