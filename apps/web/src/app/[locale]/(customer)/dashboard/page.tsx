import { getTranslations } from 'next-intl/server';

import { CustomerDashboard } from '@/components/blocks/customer-dashboard';

interface CustomerDashboardPageProps {
  params: Promise<{ locale: string }>;
}

const CustomerDashboardPage = async ({
  params,
}: CustomerDashboardPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'customer.dashboard' });

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-foreground text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <CustomerDashboard locale={locale} />
    </section>
  );
};

export default CustomerDashboardPage;
