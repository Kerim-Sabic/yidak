import { getTranslations } from 'next-intl/server';

import { AdminJobsModerationPanel } from '@/components/blocks/admin/jobs-moderation-panel';

interface AdminJobsPageProps {
  params: Promise<{ locale: string }>;
}

const AdminJobsPage = async ({ params }: AdminJobsPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'admin.pages.jobs' });

  return <AdminJobsModerationPanel title={t('title')} subtitle={t('subtitle')} />;
};

export default AdminJobsPage;
