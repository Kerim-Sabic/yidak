import type { ReactNode } from 'react';

import CustomerLayout from '@/components/layouts/CustomerLayout';

interface CustomerRouteLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

const CustomerRouteLayout = async ({
  children,
  params,
}: CustomerRouteLayoutProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';

  return <CustomerLayout locale={locale}>{children}</CustomerLayout>;
};

export default CustomerRouteLayout;
