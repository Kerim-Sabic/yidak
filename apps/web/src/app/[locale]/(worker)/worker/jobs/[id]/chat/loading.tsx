import { Skeleton } from '@/components/ui/skeleton';

const WorkerJobChatLoading = (): React.JSX.Element => (
  <div className="space-y-3">
    <Skeleton className="h-16" />
    <Skeleton className="h-[60dvh]" />
  </div>
);

export default WorkerJobChatLoading;
