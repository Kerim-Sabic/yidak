import { getTranslations } from 'next-intl/server';

import { AdminDisputesPanel } from '@/components/blocks/admin/disputes-panel';

interface AdminDisputesPageProps {
  params: Promise<{ locale: string }>;
}

const AdminDisputesPage = async ({
  params,
}: AdminDisputesPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'admin.pages.disputes' });

  return <AdminDisputesPanel title={t('title')} subtitle={t('subtitle')} />;
};

export default AdminDisputesPage;
