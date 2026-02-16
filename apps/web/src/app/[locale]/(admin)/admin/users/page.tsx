import { getTranslations } from 'next-intl/server';

import { AdminUsersPanel } from '@/components/blocks/admin/users-panel';

interface AdminUsersPageProps {
  params: Promise<{ locale: string }>;
}

const AdminUsersPage = async ({ params }: AdminUsersPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'admin.pages.users' });

  return <AdminUsersPanel title={t('title')} subtitle={t('subtitle')} />;
};

export default AdminUsersPage;
