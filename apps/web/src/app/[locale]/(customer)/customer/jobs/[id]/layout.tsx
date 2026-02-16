import { getTranslations } from 'next-intl/server';

import type { ReactNode } from 'react';

interface JobDetailLayoutProps {
  children: ReactNode;
  bids: ReactNode;
  chat: ReactNode;
  params: Promise<{ locale: string }>;
}

const JobDetailLayout = async ({
  children,
  bids,
  chat,
  params,
}: JobDetailLayoutProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'customer.jobs.detail' });

  return (
    <div className="space-y-6">
      {children}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="space-y-2">
          <h2 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
            {t('bidsSectionTitle')}
          </h2>
          {bids}
        </section>

        <section className="space-y-2">
          <h2 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
            {t('chatSectionTitle')}
          </h2>
          {chat}
        </section>
      </div>
    </div>
  );
};

export default JobDetailLayout;
