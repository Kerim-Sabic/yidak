'use client';

import { Skeleton } from '@/components/ui/skeleton';

const shimmerClass = 'skeleton-shimmer';

export const JobCardSkeleton = (): React.JSX.Element => (
  <article className="border-border bg-card rounded-2xl border p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className={`h-5 w-40 ${shimmerClass}`} />
        <Skeleton className={`h-4 w-32 ${shimmerClass}`} />
      </div>
      <Skeleton className={`h-6 w-16 rounded-full ${shimmerClass}`} />
    </div>
    <div className="mt-4 grid grid-cols-2 gap-2">
      <Skeleton className={`h-4 w-full ${shimmerClass}`} />
      <Skeleton className={`h-4 w-full ${shimmerClass}`} />
      <Skeleton className={`h-4 w-full ${shimmerClass}`} />
      <Skeleton className={`h-4 w-full ${shimmerClass}`} />
    </div>
  </article>
);

export const BidCardSkeleton = (): React.JSX.Element => (
  <article className="border-border bg-card rounded-2xl border p-4">
    <div className="flex items-center gap-3">
      <Skeleton className={`h-11 w-11 rounded-full ${shimmerClass}`} />
      <div className="flex-1 space-y-2">
        <Skeleton className={`h-4 w-32 ${shimmerClass}`} />
        <Skeleton className={`h-3 w-20 ${shimmerClass}`} />
      </div>
      <Skeleton className={`h-8 w-24 rounded-lg ${shimmerClass}`} />
    </div>
    <div className="mt-3 space-y-2">
      <Skeleton className={`h-3 w-full ${shimmerClass}`} />
      <Skeleton className={`h-3 w-5/6 ${shimmerClass}`} />
    </div>
  </article>
);

export const ChatSkeleton = (): React.JSX.Element => (
  <section className="border-border bg-card space-y-3 rounded-2xl border p-4">
    <div className="space-y-2">
      <Skeleton className={`h-4 w-28 ${shimmerClass}`} />
      <Skeleton className={`h-10 w-2/3 rounded-2xl ${shimmerClass}`} />
    </div>
    <div className="flex justify-end">
      <Skeleton className={`h-10 w-3/5 rounded-2xl ${shimmerClass}`} />
    </div>
    <div className="space-y-2">
      <Skeleton className={`h-10 w-1/2 rounded-2xl ${shimmerClass}`} />
      <Skeleton className={`h-10 w-2/3 rounded-2xl ${shimmerClass}`} />
    </div>
  </section>
);

export const ProfileSkeleton = (): React.JSX.Element => (
  <section className="border-border bg-card rounded-2xl border p-4">
    <div className="flex items-center gap-3">
      <Skeleton className={`h-16 w-16 rounded-full ${shimmerClass}`} />
      <div className="space-y-2">
        <Skeleton className={`h-5 w-40 ${shimmerClass}`} />
        <Skeleton className={`h-4 w-28 ${shimmerClass}`} />
      </div>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-2">
      <Skeleton className={`h-12 w-full ${shimmerClass}`} />
      <Skeleton className={`h-12 w-full ${shimmerClass}`} />
      <Skeleton className={`h-12 w-full ${shimmerClass}`} />
      <Skeleton className={`h-12 w-full ${shimmerClass}`} />
    </div>
  </section>
);

export const DashboardSkeleton = (): React.JSX.Element => (
  <section className="space-y-4">
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Skeleton className={`h-24 w-full rounded-2xl ${shimmerClass}`} />
      <Skeleton className={`h-24 w-full rounded-2xl ${shimmerClass}`} />
      <Skeleton className={`h-24 w-full rounded-2xl ${shimmerClass}`} />
      <Skeleton className={`h-24 w-full rounded-2xl ${shimmerClass}`} />
    </div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Skeleton className={`h-64 w-full rounded-2xl ${shimmerClass}`} />
      <Skeleton className={`h-64 w-full rounded-2xl ${shimmerClass}`} />
    </div>
    <div className="space-y-3">
      <JobCardSkeleton />
      <JobCardSkeleton />
      <JobCardSkeleton />
    </div>
  </section>
);
