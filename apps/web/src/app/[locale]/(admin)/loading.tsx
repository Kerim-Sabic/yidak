import { DashboardSkeleton } from '@/components/blocks/skeletons';

const AdminLoading = (): React.JSX.Element => (
  <main className="mx-auto max-w-[96rem] px-4 py-6">
    <DashboardSkeleton />
  </main>
);

export default AdminLoading;
