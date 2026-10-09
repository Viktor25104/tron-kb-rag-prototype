import type { ConfidenceLevelDto, SearchOriginDto, SuggestedActionTypeDto } from '@/shared/api/dto';
import type { Chunk } from './article';
import type { Fact, Language, Source, VerificationStatus } from './knowledge';

export type ConfidenceLevel = ConfidenceLevelDto;
export type SearchOrigin = SearchOriginDto;
export type SuggestedActionType = SuggestedActionTypeDto;

export interface RagFilters {
  projectId: string;
  language: Language | null;
  sourceIds: string[];
  topicIds: string[];
  entityIds: string[];
  articleIds: string[];
  dateFrom: string | null;
  dateTo: string | null;
  verificationStatuses: VerificationStatus[];
  excludeOutdated: boolean;
  minConfidence: number | null;
}

export interface RagRequest {
  text: string;
  filters: RagFilters;
  topK: number;
}

export interface CannedQuery {
  id: string;
  label: string;
  request: RagRequest;
}

export interface TraceCandidate {
  chunkId: string;
  articleId: string;
  articleTitle: string;
  score: number;
  rank: number;
}

export interface FusionCandidate {
  chunkId: string;
  articleId: string;
  articleTitle: string;
  score: number;
  normalizedScore: number;
  vectorRank: number | null;
  ftsRank: number | null;
}

export interface RerankCandidate {
  chunkId: string;
  articleId: string;
  articleTitle: string;
  score: number;
  fusedScoreNorm: number;
  entityOverlap: number;
  sourceReliability: number;
  origins: SearchOrigin[];
  dropReason: string | null;
}

export interface RagTrace {
  query: {
    original: string;
    normalized: string;
    tokens: string[];
    expansions: string[];
    detectedLanguage: Language;
    entities: { entityId: string; name: string; matchedText: string }[];
    inferredFilters: { field: string; value: string; reason: string }[];
    years: number[];
    durationMs: number;
  };
  appliedFilters: RagFilters;
  prefilter: {
    corpusBefore: number;
    corpusAfter: number;
    exclusions: { filter: string; excluded: number }[];
    durationMs: number;
  };
  vector: { topN: number; candidates: TraceCandidate[]; durationMs: number };
  fts: { topN: number; candidates: TraceCandidate[]; durationMs: number };
  fusion: { k: number; candidates: FusionCandidate[]; durationMs: number };
  rerank: {
    topK: number;
    minScore: number;
    kept: RerankCandidate[];
    dropped: RerankCandidate[];
    durationMs: number;
  };
  context: {
    chunks: number;
    facts: number;
    sources: number;
    tokenCount: number;
    excludedFacts: number;
    durationMs: number;
  };
  totalMs: number;
}

export interface ArticleRef {
  articleId: string;
  title: string;
  url: string;
  sectionId: string;
  sectionTitle: string;
  language: Language;
  updatedAt: Date;
}

export interface RankedResult {
  chunk: Chunk;
  score: number;
  verificationStatus: VerificationStatus;
  source: Source;
  articleRef: ArticleRef;
}

export interface Confidence {
  score: number;
  level: ConfidenceLevel;
  components: { rerankMean: number; verifiedShare: number; sourceDiversity: number };
  reasons: string[];
  blockedBy: string[];
}

export interface RagContext {
  chunks: RankedResult[];
  facts: Fact[];
  sources: Source[];
  confidence: Confidence;
  tokenCount: number;
  excludedTotal: number;
  excludedFacts: Fact[];
}

export interface Citation {
  marker: number;
  chunkId: string;
  articleId: string;
  sourceId: string;
  quote: string;
}

export interface AgentAnswer {
  text: string;
  citations: Citation[];
  model: string;
  promptVersion: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  durationMs: number;
}

export interface PossibleSource {
  articleId: string;
  title: string;
  chunkId: string;
  score: number;
  origins: SearchOrigin[];
  reason: string;
}

export interface LowConfidence {
  message: string;
  possibleSources: PossibleSource[];
  suggestedActions: { type: SuggestedActionType; reason: string }[];
}

export type RagOutcome =
  | { kind: 'answer'; answer: AgentAnswer }
  | { kind: 'low_confidence'; lowConfidence: LowConfidence };

export interface RagResult {
  trace: RagTrace;
  results: RankedResult[];
  context: RagContext;
  outcome: RagOutcome;
}

export const DEFAULT_PROJECT_ID = 'tron-pool-energy';
export const DEFAULT_TOP_K = 5;

export const emptyFilters = (projectId = DEFAULT_PROJECT_ID): RagFilters => ({
  projectId,
  language: null,
  sourceIds: [],
  topicIds: [],
  entityIds: [],
  articleIds: [],
  dateFrom: null,
  dateTo: null,
  verificationStatuses: [],
  excludeOutdated: true,
  minConfidence: null,
});

// Mirrors MEDIUM_CONFIDENCE_THRESHOLD in backend/app/application/config.py.
export const MEDIUM_CONFIDENCE_THRESHOLD = 0.6;

// A LOW level is worth explaining only when the score alone would have allowed an answer.
export function blockingReason(confidence: Confidence): string | null {
  if (confidence.score < MEDIUM_CONFIDENCE_THRESHOLD) return null;
  return confidence.blockedBy[0] ?? null;
}
