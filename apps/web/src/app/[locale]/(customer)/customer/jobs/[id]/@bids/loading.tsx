import { Skeleton } from '@/components/ui/skeleton';

const JobBidsLoading = (): React.JSX.Element => (
  <div className="space-y-2">
    <Skeleton className="h-24" />
    <Skeleton className="h-24" />
    <Skeleton className="h-24" />
  </div>
);

export default JobBidsLoading;
