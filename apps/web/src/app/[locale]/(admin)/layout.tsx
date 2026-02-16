import type { ReactNode } from 'react';

import AdminLayout from '@/components/layouts/AdminLayout';

interface AdminRouteLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

const AdminRouteLayout = async ({
  children,
  params,
}: AdminRouteLayoutProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';

  return <AdminLayout locale={locale}>{children}</AdminLayout>;
};

export default AdminRouteLayout;
