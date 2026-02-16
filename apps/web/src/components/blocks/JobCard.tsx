'use client';

import { formatRelativeTime } from '@yidak/utils';
import { ArrowUpRight, Gavel, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

import type { GCCCountry } from '@yidak/types';

import { CountdownTimer } from '@/components/blocks/CountdownTimer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface JobCardLabels {
  bids: string;
  lowestBid: string;
  posted: string;
  timeRemaining: string;
  expired: string;
}

interface JobCardProps {
  href: string;
  locale: 'en' | 'ar';
  title: string;
  status: string;
  budgetLabel: string;
  bidCount: number;
  lowestBidLabel: string | null;
  createdAt: string;
  expiresAt: string | null;
  categoryName: string;
  categoryIcon: LucideIcon;
  labels: JobCardLabels;
  country: GCCCountry;
}

const statusClass = (status: string): string => {
  if (status === 'completed' || status === 'reviewed') {
    return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
  }

  if (status === 'cancelled' || status === 'expired') {
    return 'bg-rose-500/15 text-rose-700 dark:text-rose-300';
  }

  if (status === 'assigned' || status === 'in_progress') {
    return 'bg-sky-500/15 text-sky-700 dark:text-sky-300';
  }

  return 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
};

const toLocale = (locale: 'en' | 'ar', country: GCCCountry): string => {
  if (locale === 'ar') {
    return `ar-${country}`;
  }

  return `en-${country}`;
};

export const JobCard = ({
  href,
  locale,
  title,
  status,
  budgetLabel,
  bidCount,
  lowestBidLabel,
  createdAt,
  expiresAt,
  categoryName,
  categoryIcon: CategoryIcon,
  labels,
  country
}: JobCardProps): React.JSX.Element => {
  const postedAgo = formatRelativeTime(new Date(createdAt), locale);

  return (
    <Link href={href} className="block">
      <Card className="border-border/80 transition-colors hover:border-primary/45">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="rounded-full border border-primary/25 bg-primary/10 p-2 text-primary">
                <CategoryIcon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{categoryName}</p>
                <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
              </div>
            </div>

            <ArrowUpRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusClass(status)}>{status}</Badge>
            <Badge variant="secondary">{budgetLabel}</Badge>
            <Badge variant="outline">
              <Gavel className="me-1 h-3 w-3" aria-hidden="true" />
              {bidCount} {labels.bids}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <p>
              {labels.posted}: {new Intl.RelativeTimeFormat(toLocale(locale, country), { numeric: 'auto' }).format(
                -Math.max(1, Math.round((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60))),
                'hour'
              )}
            </p>

            {expiresAt ? (
              <div className="inline-flex items-center gap-2">
                <span>{labels.timeRemaining}</span>
                <CountdownTimer expiresAt={expiresAt} expiredLabel={labels.expired} />
              </div>
            ) : (
              <p>
                {labels.posted}: {postedAgo}
              </p>
            )}
          </div>

          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {labels.lowestBid}:{' '}
            <span className="font-bold">{lowestBidLabel ?? '-'}</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default JobCard;
