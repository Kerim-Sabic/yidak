import { getTranslations } from 'next-intl/server';

import type { ReactNode } from 'react';

import { AuthShell } from '@/components/blocks/auth/auth-shell';

interface AuthLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

const AuthLayout = async ({ children, params }: AuthLayoutProps): Promise<React.JSX.Element> => {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale, namespace: 'auth.layout' });

  return (
    <AuthShell locale={locale} title={t('title')} tagline={t('tagline')}>
      {children}
    </AuthShell>
  );
};

export default AuthLayout;
