'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { MonitorSmartphone, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { gentleSpring } from '@/components/blocks/auth/motion';
import { NotificationCenter } from '@/components/blocks/NotificationCenter';
import { PrefetchLink } from '@/components/primitives/prefetch-link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeCount?: number;
}

interface AdminShellProps {
  title: string;
  items: ReadonlyArray<AdminNavItem>;
  userName: string;
  roleLabel: string;
  mobileTitle: string;
  mobileBody: string;
  quickSearchLabel: string;
  quickSearchPlaceholder: string;
  quickSearchEmpty: string;
  children: ReactNode;
}

const initialsFromName = (value: string): string => {
  const parts = value.trim().split(/\s+/);
  if (parts.length === 0) {
    return 'AD';
  }

  const first = parts[0]?.charAt(0) ?? 'A';
  const second = parts[1]?.charAt(0) ?? 'D';
  return `${first}${second}`.toUpperCase();
};

export const AdminShell = ({
  title,
  items,
  userName,
  roleLabel,
  mobileTitle,
  mobileBody,
  quickSearchLabel,
  quickSearchPlaceholder,
  quickSearchEmpty,
  children,
}: AdminShellProps): React.JSX.Element => {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const transitionProps = reduceMotion ? {} : { transition: gentleSpring };
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const isMac = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return true;
    }

    return navigator.platform.toLowerCase().includes('mac');
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (!isShortcut) {
        return;
      }

      event.preventDefault();
      setIsCommandOpen((previous) => !previous);
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, []);

  return (
    <>
      <div className="flex min-h-dvh items-center justify-center p-6 lg:hidden">
        <div className="border-border bg-card w-full max-w-md rounded-2xl border p-6 text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl">
            <MonitorSmartphone className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="text-foreground text-xl font-semibold">{mobileTitle}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{mobileBody}</p>
        </div>
      </div>

      <div className="mx-auto hidden min-h-dvh w-full max-w-[96rem] gap-4 p-4 lg:flex">
        <aside
          className={cn(
            'border-border bg-card shrink-0 rounded-2xl border p-3 transition-[width] duration-300',
            isCollapsed ? 'w-20' : 'w-72',
          )}
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            {isCollapsed ? (
              <span className="bg-primary/10 text-primary inline-flex h-9 w-9 items-center justify-center rounded-lg">
                Y
              </span>
            ) : (
              <h2 className="text-foreground truncate text-lg font-semibold">{title}</h2>
            )}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => {
                setIsCollapsed((previous) => !previous);
              }}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" aria-hidden />
              ) : (
                <PanelLeftClose className="h-4 w-4" aria-hidden />
              )}
            </Button>
          </div>
          <nav className="space-y-1">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <div key={item.href} className="relative">
                  {active ? (
                    <motion.span
                      layoutId="active-admin-nav"
                      {...transitionProps}
                      className="bg-primary/10 absolute inset-0 rounded-xl"
                    />
                  ) : null}
                  <PrefetchLink
                    href={item.href}
                    title={item.label}
                    className={cn(
                      'relative inline-flex min-h-11 w-full items-center rounded-xl px-3 py-2 text-sm font-medium',
                      active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                      isCollapsed ? 'justify-center' : 'gap-2',
                    )}
                  >
                    <span className="relative inline-flex">
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                      {item.badgeCount && item.badgeCount > 0 ? (
                        <span className="bg-destructive text-destructive-foreground absolute -end-2 -top-2 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]">
                          {item.badgeCount > 9 ? '9+' : item.badgeCount}
                        </span>
                      ) : null}
                    </span>
                    {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
                  </PrefetchLink>
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <header className="border-border bg-card flex items-center justify-between gap-3 rounded-2xl border p-3">
            <Button
              type="button"
              variant="outline"
              className="text-muted-foreground h-10 min-w-72 justify-between"
              onClick={() => {
                setIsCommandOpen(true);
              }}
            >
              <span className="inline-flex items-center gap-2 text-sm">
                <Search className="h-4 w-4" aria-hidden />
                {quickSearchLabel}
              </span>
              <span className="border-border rounded-md border px-2 py-0.5 text-xs">
                {isMac ? 'Cmd+K' : 'Ctrl+K'}
              </span>
            </Button>

            <div className="flex items-center gap-2">
              <NotificationCenter />
              <div className="border-border flex items-center gap-2 rounded-xl border px-2 py-1.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initialsFromName(userName)}</AvatarFallback>
                </Avatar>
                <div className="text-start">
                  <p className="max-w-40 truncate text-sm font-medium">{userName}</p>
                  <Badge variant="secondary" className="h-5 text-[10px]">
                    {roleLabel}
                  </Badge>
                </div>
              </div>
            </div>
          </header>
          <div className="border-border bg-card min-h-[calc(100dvh-8rem)] rounded-2xl border p-6">
            {children}
          </div>
        </div>
      </div>

      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder={quickSearchPlaceholder} />
        <CommandList>
          <CommandEmpty>{quickSearchEmpty}</CommandEmpty>
          <CommandGroup heading={title}>
            {items.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  setIsCommandOpen(false);
                  router.push(item.href);
                }}
              >
                <item.icon className="h-4 w-4" aria-hidden />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};
