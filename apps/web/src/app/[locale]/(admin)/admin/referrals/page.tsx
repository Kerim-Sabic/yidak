import { getTranslations } from 'next-intl/server';

import { AdminReferralsPanel } from '@/components/blocks/admin/referrals-panel';

interface AdminReferralsPageProps {
  params: Promise<{ locale: string }>;
}

const AdminReferralsPage = async ({
  params,
}: AdminReferralsPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'admin.pages.referrals' });

  return <AdminReferralsPanel title={t('title')} subtitle={t('subtitle')} />;
};

export default AdminReferralsPage;
