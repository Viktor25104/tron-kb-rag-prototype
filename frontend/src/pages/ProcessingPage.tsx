import { JobCard, useProcessingQueue } from '@/features/processing';
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from '@/shared/ui';

export function ProcessingPage() {
  const queue = useProcessingQueue();
  return (
    <>
      <PageHeader
        title="Processing"
        description="Failed, running and queued jobs first, then the most recently processed articles."
      />
      {queue.isPending && <LoadingBlock />}
      {queue.isError && <ErrorBlock error={queue.error} />}
      {queue.data?.length === 0 && <EmptyState>The queue is empty.</EmptyState>}
      <div className="flex flex-col gap-3">
        {queue.data?.map((item) => (
          <JobCard key={item.job.articleId} item={item} />
        ))}
      </div>
    </>
  );
}
