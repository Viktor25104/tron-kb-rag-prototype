import {
  mapProcessingJob,
  mapQueueItem,
  type ProcessingJob,
  type QueueItem,
} from '@/entities/processing';
import type { ApiClient } from '@/shared/api';

export async function fetchProcessingQueue(client: ApiClient): Promise<QueueItem[]> {
  return (await client.getProcessingQueue()).map(mapQueueItem);
}

export async function fetchProcessingJob(
  client: ApiClient,
  articleId: string,
): Promise<ProcessingJob> {
  return mapProcessingJob(await client.getArticleProcessing(articleId));
}
