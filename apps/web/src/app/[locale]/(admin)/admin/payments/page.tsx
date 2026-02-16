import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';

import { DashboardSkeleton } from '@/components/blocks/skeletons';

const AdminPaymentsPanel = dynamic(
  async () =>
    import('@/components/blocks/admin/payments-panel').then((mod) => mod.AdminPaymentsPanel),
  {
    loading: () => <DashboardSkeleton />,
  },
);

interface AdminPaymentsPageProps {
  params: Promise<{ locale: string }>;
}

const AdminPaymentsPage = async ({
  params,
}: AdminPaymentsPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'admin.pages.payments' });

  return <AdminPaymentsPanel title={t('title')} subtitle={t('subtitle')} />;
};

export default AdminPaymentsPage;
