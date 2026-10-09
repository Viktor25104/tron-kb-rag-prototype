import { useQuery } from '@tanstack/react-query';
import type { RagRequest } from '@/entities/rag';
import { useApiClient } from '@/shared/api';
import { fetchCannedQueries, runRagQuery } from './api';

export const ragKeys = {
  all: ['rag'] as const,
  canned: () => [...ragKeys.all, 'canned'] as const,
  query: (request: RagRequest | null) => [...ragKeys.all, 'query', request] as const,
};

export function useRagQuery(request: RagRequest | null) {
  const client = useApiClient();
  return useQuery({
    queryKey: ragKeys.query(request),
    queryFn: () => {
      if (!request) throw new Error('No query to run');
      return runRagQuery(client, request);
    },
    enabled: request !== null,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });
}

// Context and answer screens never trigger a new pipeline run; they only read what the
// search screen already put into the cache.
export function useCachedRagResult(request: RagRequest | null) {
  const client = useApiClient();
  return useQuery({
    queryKey: ragKeys.query(request),
    queryFn: () => {
      if (!request) throw new Error('No query to run');
      return runRagQuery(client, request);
    },
    enabled: false,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });
}

export function useCannedQueries() {
  const client = useApiClient();
  return useQuery({
    queryKey: ragKeys.canned(),
    queryFn: () => fetchCannedQueries(client),
    staleTime: Infinity,
  });
}
