import { getTranslations } from 'next-intl/server';

import { CustomerPaymentsPanel } from '@/components/blocks/customer-payments-panel';

interface PaymentsPageProps {
  params: Promise<{ locale: string }>;
}

const PaymentsPage = async ({ params }: PaymentsPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'customer.payments' });

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>
      <CustomerPaymentsPanel locale={locale} />
    </section>
  );
};

export default PaymentsPage;
