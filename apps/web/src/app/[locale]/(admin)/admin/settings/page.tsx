import { getTranslations } from 'next-intl/server';

import { AdminSettingsPanel } from '@/components/blocks/admin/settings-panel';

interface AdminSettingsPageProps {
  params: Promise<{ locale: string }>;
}

const AdminSettingsPage = async ({
  params,
}: AdminSettingsPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'admin.pages.settings' });

  return <AdminSettingsPanel title={t('title')} subtitle={t('subtitle')} />;
};

export default AdminSettingsPage;
