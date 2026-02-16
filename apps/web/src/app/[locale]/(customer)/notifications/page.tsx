import { getTranslations } from 'next-intl/server';

import { NotificationCenter } from '@/components/blocks/NotificationCenter';

interface CustomerNotificationsPageProps {
  params: Promise<{ locale: string }>;
}

const CustomerNotificationsPage = async ({
  params,
}: CustomerNotificationsPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'notificationsCenter' });

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold">{t('historyTitle')}</h1>
        <p className="text-muted-foreground text-sm">{t('historySubtitle')}</p>
      </header>
      <NotificationCenter mode="page" />
    </section>
  );
};

export default CustomerNotificationsPage;
