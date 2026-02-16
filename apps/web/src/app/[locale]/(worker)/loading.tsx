import { DashboardSkeleton } from '@/components/blocks/skeletons';

const WorkerLoading = (): React.JSX.Element => (
  <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
    <DashboardSkeleton />
  </main>
);

export default WorkerLoading;
