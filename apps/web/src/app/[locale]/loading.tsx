import { DashboardSkeleton } from '@/components/blocks/skeletons';

const LoadingPage = (): React.JSX.Element => (
  <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
    <DashboardSkeleton />
  </main>
);

export default LoadingPage;
