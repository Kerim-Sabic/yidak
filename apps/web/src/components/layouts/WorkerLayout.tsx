
import { BadgeDollarSign, BriefcaseBusiness, Gift, Handshake, ListChecks, Trophy, UserRound } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import type { ReactNode } from 'react';

import { AvailabilityToggle } from '@/components/layouts/availability-toggle';
import { NavShell, type NavItem } from '@/components/layouts/nav-shell';
import { requireRole } from '@/lib/supabase/server';

interface WorkerLayoutProps {
  children: ReactNode;
  locale: 'en' | 'ar';
}

const workerFallback = (): React.JSX.Element => (
  <div className="space-y-3">
    <div className="h-6 w-40 animate-pulse-gentle rounded bg-muted" />
    <div className="h-28 animate-pulse-gentle rounded-xl bg-muted" />
  </div>
);

const WorkerLayout = async ({ children, locale }: WorkerLayoutProps): Promise<React.JSX.Element> => {
  await requireRole('worker', locale);
  const t = await getTranslations({ locale, namespace: 'worker.layout' });

  const items: ReadonlyArray<NavItem> = [
    { href: `/${locale}/worker/jobs`, label: t('availableJobs'), icon: BriefcaseBusiness },
    { href: `/${locale}/worker/bids`, label: t('myBids'), icon: ListChecks },
    { href: `/${locale}/worker/active-jobs`, label: t('activeJobs'), icon: Handshake, badgeCount: 2 },
    { href: `/${locale}/worker/earnings`, label: t('earnings'), icon: BadgeDollarSign },
    { href: `/${locale}/worker/profile`, label: t('profile'), icon: UserRound },
    { href: `/${locale}/worker/referrals`, label: t('referrals'), icon: Gift },
    { href: `/${locale}/leaderboard`, label: t('leaderboard'), icon: Trophy }
  ];

  return (
    <NavShell title={t('title')} items={items} headerAccessory={<AvailabilityToggle label={t('availability')} />}>
      <Suspense fallback={workerFallback()}>{children}</Suspense>
    </NavShell>
  );
};

export default WorkerLayout;
