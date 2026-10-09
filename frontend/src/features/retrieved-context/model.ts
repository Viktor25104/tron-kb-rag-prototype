import type { Confidence, RagContext } from '@/entities/rag';
import { formatNumber } from '@/shared/ui';

// Mirrors backend/app/application/config.py; the API returns the components, not the weights.
export const CONFIDENCE_WEIGHTS = {
  rerankMean: 0.5,
  verifiedShare: 0.3,
  sourceDiversity: 0.2,
} as const;

export const CONFIDENCE_COMPONENTS: {
  key: keyof Confidence['components'];
  label: string;
  hint: string;
}[] = [
  { key: 'rerankMean', label: 'Rerank mean', hint: 'missing slots below 3 results count as 0' },
  { key: 'verifiedShare', label: 'Verified facts share', hint: 'verified / all facts in context' },
  { key: 'sourceDiversity', label: 'Source diversity', hint: 'min(unique sources / 3, 1)' },
];

export function contextHeadline(context: RagContext): { sent: string; notSent: string } {
  return {
    sent: `${context.chunks.length} chunks, ${context.facts.length} facts, ${context.sources.length} sources, ~${formatNumber(context.tokenCount)} tokens`,
    notSent: `${formatNumber(context.excludedTotal)} chunks`,
  };
}
