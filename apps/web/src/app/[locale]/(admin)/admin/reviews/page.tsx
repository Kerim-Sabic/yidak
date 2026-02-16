import { getTranslations } from 'next-intl/server';

import { AdminReviewsPanel } from '@/components/blocks/admin/reviews-panel';

interface AdminReviewsPageProps {
  params: Promise<{ locale: string }>;
}

const AdminReviewsPage = async ({ params }: AdminReviewsPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'admin.pages.reviews' });

  return <AdminReviewsPanel title={t('title')} subtitle={t('subtitle')} />;
};

export default AdminReviewsPage;
