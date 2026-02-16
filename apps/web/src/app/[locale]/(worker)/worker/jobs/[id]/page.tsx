import { getTranslations } from 'next-intl/server';

import { WorkerJobDetail } from '@/components/blocks/worker-job-detail';

interface WorkerJobDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

const WorkerJobDetailPage = async ({
  params,
}: WorkerJobDetailPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale, id } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'worker.jobDetail' });

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <WorkerJobDetail locale={locale} jobId={id} />
    </section>
  );
};

export default WorkerJobDetailPage;
