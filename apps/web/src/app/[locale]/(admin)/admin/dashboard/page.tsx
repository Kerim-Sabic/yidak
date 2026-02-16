import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';

import { DashboardSkeleton } from '@/components/blocks/skeletons';

const AdminDashboardOverview = dynamic(
  async () =>
    import('@/components/blocks/admin/dashboard-overview').then(
      (mod) => mod.AdminDashboardOverview,
    ),
  {
    loading: () => <DashboardSkeleton />,
  },
);

interface AdminDashboardPageProps {
  params: Promise<{ locale: string }>;
}

const AdminDashboardPage = async ({
  params,
}: AdminDashboardPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'admin.pages.dashboard' });

  return <AdminDashboardOverview locale={locale} title={t('title')} subtitle={t('subtitle')} />;
};

export default AdminDashboardPage;
