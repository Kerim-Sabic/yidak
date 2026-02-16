import { getTranslations } from 'next-intl/server';

const WorkerProfilePage = async (): Promise<React.JSX.Element> => {
  const t = await getTranslations('worker.profile');

  return (
    <section>
      <h1 className="text-foreground text-2xl font-semibold">{t('title')}</h1>
      <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
    </section>
  );
};

export default WorkerProfilePage;
