import { getTranslations } from 'next-intl/server';

import { NotificationPreferencesForm } from '@/components/blocks/notification-preferences-form';
import { requireAuth } from '@/lib/supabase/server';

interface NotificationSettingsPageProps {
  params: Promise<{ locale: string }>;
}

const NotificationSettingsPage = async ({
  params,
}: NotificationSettingsPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  await requireAuth(locale);
  const t = await getTranslations({ locale, namespace: 'notificationPreferences' });

  return (
    <section className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>
      <NotificationPreferencesForm locale={locale} />
    </section>
  );
};

export default NotificationSettingsPage;
