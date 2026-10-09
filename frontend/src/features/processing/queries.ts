import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/shared/api';
import { fetchProcessingJob, fetchProcessingQueue } from './api';

export const processingKeys = {
  all: ['processing'] as const,
  queue: () => [...processingKeys.all, 'queue'] as const,
  job: (articleId: string) => [...processingKeys.all, 'job', articleId] as const,
};

export function useProcessingQueue() {
  const client = useApiClient();
  return useQuery({
    queryKey: processingKeys.queue(),
    queryFn: () => fetchProcessingQueue(client),
  });
}

export function useProcessingJob(articleId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: processingKeys.job(articleId),
    queryFn: () => fetchProcessingJob(client, articleId),
  });
}
