import { getTranslations } from 'next-intl/server';

import { WorkerLeaderboard } from '@/components/blocks/worker-leaderboard';

interface WorkerLeaderboardPageProps {
  params: Promise<{ locale: string }>;
}

const WorkerLeaderboardPage = async ({
  params,
}: WorkerLeaderboardPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'leaderboard' });

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>
      <WorkerLeaderboard locale={locale} />
    </section>
  );
};

export default WorkerLeaderboardPage;
