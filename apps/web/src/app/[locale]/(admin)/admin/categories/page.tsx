import { getTranslations } from 'next-intl/server';

import { AdminCategoriesPanel } from '@/components/blocks/admin/categories-panel';

interface AdminCategoriesPageProps {
  params: Promise<{ locale: string }>;
}

const AdminCategoriesPage = async ({
  params,
}: AdminCategoriesPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'admin.pages.categories' });

  return <AdminCategoriesPanel title={t('title')} subtitle={t('subtitle')} />;
};

export default AdminCategoriesPage;
