import {
  BellRing,
  FolderTree,
  Gavel,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Star,
  TicketPercent,
  UsersRound,
  Wrench,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { AdminShell } from '@/components/layouts/admin-shell';
import { requireRole } from '@/lib/supabase/server';

interface AdminLayoutProps {
  children: ReactNode;
  locale: 'en' | 'ar';
}

interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeCount?: number;
}

const adminFallback = (): React.JSX.Element => (
  <div className="space-y-3">
    <div className="animate-pulse-gentle bg-muted h-6 w-48 rounded" />
    <div className="animate-pulse-gentle bg-muted h-32 rounded-xl" />
  </div>
);

const AdminLayout = async ({ children, locale }: AdminLayoutProps): Promise<React.JSX.Element> => {
  const profile = await requireRole('admin', locale);
  const t = await getTranslations({ locale, namespace: 'admin.layout' });
  const common = await getTranslations({ locale, namespace: 'admin.common' });

  const items: ReadonlyArray<AdminNavItem> = [
    { href: `/${locale}/admin/dashboard`, label: t('dashboard'), icon: LayoutDashboard },
    { href: `/${locale}/admin/users`, label: t('users'), icon: UsersRound },
    { href: `/${locale}/admin/jobs`, label: t('jobs'), icon: Wrench, badgeCount: 6 },
    { href: `/${locale}/admin/payments`, label: t('payments'), icon: ReceiptText },
    { href: `/${locale}/admin/disputes`, label: t('disputes'), icon: Gavel, badgeCount: 3 },
    { href: `/${locale}/admin/reviews`, label: t('reviews'), icon: Star, badgeCount: 4 },
    { href: `/${locale}/admin/categories`, label: t('categories'), icon: FolderTree },
    { href: `/${locale}/admin/referrals`, label: t('referrals'), icon: TicketPercent },
    {
      href: `/${locale}/admin/notifications`,
      label: t('notifications'),
      icon: BellRing,
      badgeCount: 2,
    },
    { href: `/${locale}/admin/settings`, label: t('settings'), icon: Settings },
  ] as const;

  return (
    <AdminShell
      title={t('title')}
      items={items}
      userName={profile.full_name}
      roleLabel={common('roles.admin')}
      mobileTitle={t('mobile.title')}
      mobileBody={t('mobile.body')}
      quickSearchLabel={common('quickSearch')}
      quickSearchPlaceholder={common('searchPlaceholder')}
      quickSearchEmpty={common('searchEmpty')}
    >
      <Suspense fallback={adminFallback()}>{children}</Suspense>
    </AdminShell>
  );
};

export default AdminLayout;
