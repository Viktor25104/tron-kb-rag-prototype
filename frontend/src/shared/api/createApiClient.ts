import type { ApiClient, ApiMode } from './ApiClient';
import type { ApiSnapshotDto, TracesSnapshotDto } from './dto';
import { HttpApiClient } from './HttpApiClient';
import { InMemoryApiClient } from './InMemoryApiClient';

function cachedJson<T>(path: string): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () => {
    pending ??= fetch(`${import.meta.env.BASE_URL}${path}`).then((response) => {
      if (!response.ok) throw new Error(`Failed to load ${path}`);
      return response.json() as Promise<T>;
    });
    return pending;
  };
}

export function resolveApiMode(value: string | undefined): ApiMode {
  return value === 'http' ? 'http' : 'memory';
}

export function createApiClient(): ApiClient {
  const loadTraces = cachedJson<TracesSnapshotDto>('fixtures/traces.json');
  if (resolveApiMode(import.meta.env.VITE_API_MODE) === 'http') {
    const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';
    return new HttpApiClient(baseUrl, loadTraces);
  }
  return new InMemoryApiClient(cachedJson<ApiSnapshotDto>('fixtures/api.json'), loadTraces);
}
