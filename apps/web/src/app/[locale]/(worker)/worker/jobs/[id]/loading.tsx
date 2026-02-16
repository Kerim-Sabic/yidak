import { Skeleton } from '@/components/ui/skeleton';

const WorkerJobDetailLoading = (): React.JSX.Element => (
  <div className="space-y-3">
    <Skeleton className="h-24" />
    <Skeleton className="h-72" />
  </div>
);

export default WorkerJobDetailLoading;
