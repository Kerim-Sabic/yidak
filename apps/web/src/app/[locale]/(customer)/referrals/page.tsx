import { getTranslations } from 'next-intl/server';

import { ReferralDashboard } from '@/components/blocks/referral-dashboard';

interface CustomerReferralsPageProps {
  params: Promise<{ locale: string }>;
}

const CustomerReferralsPage = async ({
  params,
}: CustomerReferralsPageProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'referrals' });

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>
      <ReferralDashboard locale={locale} />
    </section>
  );
};

export default CustomerReferralsPage;
