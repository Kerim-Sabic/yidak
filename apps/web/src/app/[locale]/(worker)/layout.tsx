import type { ReactNode } from 'react';

import WorkerLayout from '@/components/layouts/WorkerLayout';

interface WorkerRouteLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

const WorkerRouteLayout = async ({
  children,
  params,
}: WorkerRouteLayoutProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';

  return <WorkerLayout locale={locale}>{children}</WorkerLayout>;
};

export default WorkerRouteLayout;
