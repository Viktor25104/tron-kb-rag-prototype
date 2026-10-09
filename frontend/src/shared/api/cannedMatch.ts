import type { CannedQueryDto, RagFiltersDto, RagQueryRequestDto } from './dto';

// Below this Jaccard overlap a query is treated as "not one of ours" rather than
// silently answered with a trace that belongs to a different question.
export const CANNED_MATCH_THRESHOLD = 0.5;

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'can', 'do', 'does', 'for', 'how', 'i', 'in', 'is', 'it', 'my',
  'of', 'on', 'or', 'the', 'to', 'what', 'when', 'which', 'why', 'will', 'with', 'you',
]); // prettier-ignore

const TOKEN_RE = /[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu;

export function tokenize(text: string): Set<string> {
  const tokens = new Set<string>();
  for (const raw of text.toLowerCase().match(TOKEN_RE) ?? []) {
    const token = raw.replaceAll('-', '');
    if (STOPWORDS.has(token)) continue;
    const stemmed =
      token.length > 3 && token.endsWith('s') && !token.endsWith('ss') ? token.slice(0, -1) : token;
    tokens.add(stemmed);
  }
  return tokens;
}

export function similarity(left: string, right: string): number {
  const a = tokenize(left);
  const b = tokenize(right);
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / (a.size + b.size - shared);
}

function sameFilters(left: RagFiltersDto, right: RagFiltersDto): boolean {
  const normalize = (f: RagFiltersDto) =>
    JSON.stringify({
      ...f,
      source_ids: [...f.source_ids].sort(),
      topic_ids: [...f.topic_ids].sort(),
      entity_ids: [...f.entity_ids].sort(),
      article_ids: [...f.article_ids].sort(),
      verification_statuses: [...f.verification_statuses].sort(),
    });
  return normalize(left) === normalize(right);
}

export function findCannedQuery(
  request: RagQueryRequestDto,
  canned: CannedQueryDto[],
): CannedQueryDto | null {
  let best: { query: CannedQueryDto; score: number } | null = null;
  for (const query of canned) {
    if (query.request.top_k !== request.top_k) continue;
    if (!sameFilters(query.request.filters, request.filters)) continue;
    const score = similarity(request.text, query.request.text);
    if (score >= CANNED_MATCH_THRESHOLD && (best === null || score > best.score)) {
      best = { query, score };
    }
  }
  return best?.query ?? null;
}
