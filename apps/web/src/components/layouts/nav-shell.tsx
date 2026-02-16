'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { gentleSpring } from '@/components/blocks/auth/motion';
import { NotificationCenter } from '@/components/blocks/NotificationCenter';
import { PrefetchLink } from '@/components/primitives/prefetch-link';
import { useMessageUnreadCount } from '@/hooks/use-message-unread-count';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeCount?: number;
}

interface NavShellProps {
  title: string;
  children: ReactNode;
  items: ReadonlyArray<NavItem>;
  headerAccessory?: ReactNode;
}

const NavLink = ({
  item,
  active,
  reduceMotion,
}: {
  item: NavItem;
  active: boolean;
  reduceMotion: boolean;
}): React.JSX.Element => {
  const badgeTransitionProps = reduceMotion ? {} : { transition: gentleSpring };

  return (
    <PrefetchLink
      href={item.href}
      className={`relative inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
    >
      <item.icon className="h-4 w-4" aria-hidden />
      <span>{item.label}</span>
      <AnimatePresence>
        {item.badgeCount && item.badgeCount > 0 ? (
          <motion.span
            key={`badge-${item.badgeCount}`}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            {...badgeTransitionProps}
            className="bg-destructive text-destructive-foreground inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold"
          >
            {item.badgeCount}
          </motion.span>
        ) : (
          <></>
        )}
      </AnimatePresence>
    </PrefetchLink>
  );
};

export const NavShell = ({
  title,
  children,
  items,
  headerAccessory,
}: NavShellProps): React.JSX.Element => {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion() ?? false;
  const transitionProps = reduceMotion ? {} : { transition: gentleSpring };
  const { unreadCount } = useMessageUnreadCount(true);
  const baseTitleRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const currentTitle = document.title;
    baseTitleRef.current ??= currentTitle.replace(/^\(\d+\)\s*/, '');

    const baseTitle = baseTitleRef.current;
    document.title = unreadCount > 0 ? `(${unreadCount}) ${baseTitle}` : baseTitle;
  }, [unreadCount]);

  const enrichedItems = useMemo(
    () =>
      items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const nextBadgeCount = item.href.includes('/messages') ? unreadCount : item.badgeCount;

        if (nextBadgeCount === undefined) {
          return {
            ...item,
            active,
          };
        }

        return {
          ...item,
          badgeCount: nextBadgeCount,
          active,
        };
      }),
    [items, pathname, unreadCount],
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-7xl gap-6 px-4 pb-24 pt-6 sm:px-6 lg:pb-6">
      <aside className="border-border bg-card hidden w-64 shrink-0 rounded-2xl border p-4 lg:block">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-foreground text-lg font-semibold">{title}</h2>
          <div className="flex items-center gap-1">
            {headerAccessory}
            <NotificationCenter />
          </div>
        </div>
        <nav className="space-y-1">
          {enrichedItems.map((item) => (
            <div key={item.href} className="relative">
              {item.active ? (
                <motion.span
                  layoutId="active-desktop-nav"
                  {...transitionProps}
                  className="bg-primary/10 absolute inset-0 rounded-xl"
                />
              ) : (
                <></>
              )}
              <NavLink item={item} active={item.active} reduceMotion={reduceMotion} />
            </div>
          ))}
        </nav>
      </aside>

      <div className="border-border bg-card flex-1 rounded-2xl border p-4 sm:p-6">
        <header className="mb-5 flex items-center justify-between gap-3 lg:hidden">
          <h2 className="text-foreground text-lg font-semibold">{title}</h2>
          <div className="flex items-center gap-1">
            {headerAccessory}
            <NotificationCenter />
          </div>
        </header>
        {children}
      </div>

      <nav className="border-border bg-background/95 fixed inset-x-0 bottom-0 border-t px-2 py-2 backdrop-blur lg:hidden">
        <ul className="mx-auto grid max-w-2xl grid-cols-4 gap-1">
          {enrichedItems.slice(0, 4).map((item) => (
            <li key={item.href} className="relative">
              {item.active ? (
                <motion.span
                  layoutId="active-mobile-nav"
                  {...transitionProps}
                  className="bg-primary/10 absolute inset-0 rounded-xl"
                />
              ) : (
                <></>
              )}
              <NavLink item={item} active={item.active} reduceMotion={reduceMotion} />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
