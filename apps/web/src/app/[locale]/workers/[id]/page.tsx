import nextDynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';

import { ProfileSkeleton } from '@/components/blocks/skeletons';

const WorkerPublicProfile = nextDynamic(
  async () =>
    import('@/components/blocks/worker-public-profile').then((mod) => mod.WorkerPublicProfile),
  {
    loading: () => <ProfileSkeleton />,
  },
);

interface WorkerPublicPageProps {
  params?: Promise<{ locale: string; id: string }>;
}

export const dynamic = 'force-dynamic';

const WorkerPublicPage = async ({ params }: WorkerPublicPageProps): Promise<React.JSX.Element> => {
  const paramsData = params ? await params : undefined;
  const resolvedParams = paramsData ?? {
    locale: 'en',
    id: '',
  };
  const { locale: rawLocale, id } = resolvedParams;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'workers.publicProfile' });

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t('pageTitle')}</h1>
        <p className="text-muted-foreground text-sm">{t('pageSubtitle')}</p>
      </header>
      <WorkerPublicProfile locale={locale} userId={id} />
    </section>
  );
};

export default WorkerPublicPage;
