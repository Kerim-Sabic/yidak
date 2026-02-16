
import { BriefcaseBusiness, Gift, Home, MessageSquare, Settings, UserRound } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import type { ReactNode } from 'react';

import { NavShell, type NavItem } from '@/components/layouts/nav-shell';
import { requireRole } from '@/lib/supabase/server';

interface CustomerLayoutProps {
  children: ReactNode;
  locale: 'en' | 'ar';
}

const customerFallback = (): React.JSX.Element => (
  <div className="space-y-3">
    <div className="h-6 w-44 animate-pulse-gentle rounded bg-muted" />
    <div className="h-28 animate-pulse-gentle rounded-xl bg-muted" />
  </div>
);

const CustomerLayout = async ({ children, locale }: CustomerLayoutProps): Promise<React.JSX.Element> => {
  await requireRole('customer', locale);
  const t = await getTranslations({ locale, namespace: 'customer.layout' });

  const items: ReadonlyArray<NavItem> = [
    { href: `/${locale}/customer/dashboard`, label: t('home'), icon: Home },
    { href: `/${locale}/customer/jobs`, label: t('jobs'), icon: BriefcaseBusiness },
    { href: `/${locale}/customer/messages`, label: t('messages'), icon: MessageSquare, badgeCount: 3 },
    { href: `/${locale}/customer/profile`, label: t('profile'), icon: UserRound, badgeCount: 1 },
    { href: `/${locale}/referrals`, label: t('referrals'), icon: Gift },
    { href: `/${locale}/customer/settings`, label: t('settings'), icon: Settings }
  ];

  return (
    <NavShell title={t('title')} items={items}>
      <Suspense fallback={customerFallback()}>{children}</Suspense>
    </NavShell>
  );
};

export default CustomerLayout;
