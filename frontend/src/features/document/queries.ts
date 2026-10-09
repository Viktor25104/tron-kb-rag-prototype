import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/shared/api';
import { fetchArticleDetail } from './api';

export const documentKeys = {
  detail: (id: string) => ['document', id] as const,
};

export function useArticleDetail(id: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => fetchArticleDetail(client, id),
  });
}
