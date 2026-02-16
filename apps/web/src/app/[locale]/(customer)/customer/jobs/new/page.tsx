import { getTranslations } from 'next-intl/server';

import { JobPostingFlow } from '@/components/blocks/job-posting/job-posting-flow';

interface NewJobPageProps {
  params: Promise<{ locale: string }>;
}

const NewJobPage = async ({ params }: NewJobPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'customer.jobs.new' });

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-foreground text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <JobPostingFlow locale={locale} />
    </section>
  );
};

export default NewJobPage;
