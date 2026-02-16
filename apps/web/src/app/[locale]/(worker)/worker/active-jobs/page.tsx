import { getTranslations } from 'next-intl/server';

const Page = async (): Promise<React.JSX.Element> => {
  const t = await getTranslations('worker.layout');

  return (
    <section>
      <h1 className="text-foreground text-2xl font-semibold">{t('activeJobs')}</h1>
      <p className="text-muted-foreground mt-2 text-sm">{t('activeJobs')}</p>
    </section>
  );
};

export default Page;
