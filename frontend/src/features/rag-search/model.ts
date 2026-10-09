import {
  DEFAULT_TOP_K,
  emptyFilters,
  type RagFilters,
  type RagRequest,
  type RerankCandidate,
} from '@/entities/rag';

const TEXT_PARAM = 'q';
const FILTERS_PARAM = 'f';
const TOP_K_PARAM = 'k';

// Only non-default filters go into the URL so shared links stay short and readable.
export function encodeRequest(request: RagRequest): URLSearchParams {
  const params = new URLSearchParams({ [TEXT_PARAM]: request.text });
  const defaults = emptyFilters(request.filters.projectId);
  const changed = Object.fromEntries(
    Object.entries(request.filters).filter(
      ([key, value]) => JSON.stringify(value) !== JSON.stringify(defaults[key as keyof RagFilters]),
    ),
  );
  if (Object.keys(changed).length > 0) params.set(FILTERS_PARAM, JSON.stringify(changed));
  if (request.topK !== DEFAULT_TOP_K) params.set(TOP_K_PARAM, String(request.topK));
  return params;
}

export function decodeRequest(params: URLSearchParams): RagRequest | null {
  const text = params.get(TEXT_PARAM)?.trim();
  if (!text) return null;
  let overrides: Partial<RagFilters> = {};
  try {
    overrides = JSON.parse(params.get(FILTERS_PARAM) ?? '{}') as Partial<RagFilters>;
  } catch {
    overrides = {};
  }
  const topK = Number(params.get(TOP_K_PARAM) ?? DEFAULT_TOP_K);
  return {
    text,
    filters: { ...emptyFilters(), ...overrides },
    topK: Number.isInteger(topK) && topK > 0 ? topK : DEFAULT_TOP_K,
  };
}

export function requestSearch(request: RagRequest): string {
  return `?${encodeRequest(request).toString()}`;
}

export function countActiveFilters(filters: RagFilters): number {
  const defaults = emptyFilters(filters.projectId);
  return (Object.keys(filters) as (keyof RagFilters)[]).filter(
    (key) => JSON.stringify(filters[key]) !== JSON.stringify(defaults[key]),
  ).length;
}

export function describeOrigins(candidate: Pick<RerankCandidate, 'origins'>): string {
  return candidate.origins.map((origin) => (origin === 'fts' ? 'FTS' : 'vector')).join(' + ');
}
