export type LanguageDto = 'EN' | 'RU' | 'UA' | 'TR' | 'ES';
export type ProcessingStatusDto = 'QUEUED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
export type ProcessingStageDto =
  'PARSING' | 'SECTIONING' | 'CHUNKING' | 'KNOWLEDGE_EXTRACTION' | 'EMBEDDING' | 'INDEXED';
export type StageStateDto = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type VerificationStatusDto =
  'VERIFIED' | 'UNVERIFIED' | 'OUTDATED' | 'CONFLICTING' | 'NO_SOURCE';
export type SourceTypeDto =
  'SITE' | 'TRON_DOCS' | 'GSC' | 'GA4' | 'AHREFS' | 'AI_VISIBILITY' | 'EXTERNAL';
export type EntityTypeDto = 'NETWORK' | 'TOKEN' | 'TOKEN_STANDARD' | 'RESOURCE' | 'MECHANISM';
export type SearchOriginDto = 'vector' | 'fts';
export type ConfidenceLevelDto = 'HIGH' | 'MEDIUM' | 'LOW';
export type SuggestedActionTypeDto =
  'broaden_filters' | 'request_fact_verification' | 'create_content_gap_recommendation';

export interface SourceDto {
  id: string;
  name: string;
  type: SourceTypeDto;
  url: string;
  reliability: number;
}

export interface EntityDto {
  id: string;
  name: string;
  type: EntityTypeDto;
  aliases: string[];
}

export interface TopicDto {
  id: string;
  name: string;
  parent_id: string | null;
}

export interface ChunkDto {
  id: string;
  section_id: string;
  article_id: string;
  text: string;
  token_count: number;
  embedding_model: string | null;
  embedded: boolean;
  created_at: string;
  semantic_tags: string[];
}

export interface SectionDto {
  id: string;
  title: string;
  order: number;
  chunks: ChunkDto[];
}

export interface ArticleVersionDto {
  version: string;
  released_at: string;
  change_reason: string;
  is_live: boolean;
}

export interface ArticleSummaryDto {
  id: string;
  project_id: string;
  title: string;
  url: string;
  source_id: string;
  language: LanguageDto;
  version: string;
  status: ProcessingStatusDto;
  updated_at: string;
  chunk_count: number;
  embedded_count: number;
}

export interface ArticleListItemDto extends ArticleSummaryDto {
  fact_counts: Record<VerificationStatusDto, number>;
}

export interface ArticleDto extends ArticleSummaryDto {
  sections: SectionDto[];
  versions: ArticleVersionDto[];
}

export interface FactDto {
  id: string;
  chunk_id: string;
  statement: string;
  status: VerificationStatusDto;
  source_id: string | null;
  verified_at: string | null;
}

export interface ClaimDto {
  id: string;
  chunk_id: string;
  statement: string;
  status: VerificationStatusDto;
  source_id: string | null;
}

export interface ArticleDetailDto {
  article: ArticleDto;
  facts: FactDto[];
  claims: ClaimDto[];
  entities: EntityDto[];
  topics: TopicDto[];
  sources: SourceDto[];
  chunk_entities: Record<string, string[]>;
}

export interface StageResultDto {
  stage: ProcessingStageDto;
  state: StageStateDto;
  duration_ms: number | null;
  counters: Record<string, number>;
}

export interface StageErrorDto {
  stage: ProcessingStageDto;
  message: string;
  retries: number;
  occurred_at: string;
  log: string[];
}

export interface ProcessingJobDto {
  article_id: string;
  status: ProcessingStatusDto;
  current_stage: ProcessingStageDto | null;
  stages: StageResultDto[];
  error: StageErrorDto | null;
  updated_at: string;
}

export interface QueueItemDto {
  job: ProcessingJobDto;
  article: ArticleSummaryDto;
}

export interface FilterOptionsDto {
  project_ids: string[];
  languages: LanguageDto[];
  statuses: ProcessingStatusDto[];
  verification_statuses: VerificationStatusDto[];
  sources: SourceDto[];
  topics: TopicDto[];
  entities: EntityDto[];
  articles: { id: string; title: string; language: LanguageDto }[];
  date_min: string | null;
  date_max: string | null;
}

export interface ArticleListParamsDto {
  project_id?: string;
  language?: LanguageDto;
  source_id?: string;
  status?: ProcessingStatusDto;
  topic_id?: string;
}

export interface RagFiltersDto {
  project_id: string;
  language: LanguageDto | null;
  source_ids: string[];
  topic_ids: string[];
  entity_ids: string[];
  article_ids: string[];
  date_from: string | null;
  date_to: string | null;
  verification_statuses: VerificationStatusDto[];
  exclude_outdated: boolean;
  min_confidence: number | null;
}

export interface RagQueryRequestDto {
  text: string;
  filters: RagFiltersDto;
  top_k: number;
}

export interface MatchedEntityDto {
  entity_id: string;
  name: string;
  matched_text: string;
}

export interface InferredFilterDto {
  field: string;
  value: string;
  reason: string;
}

export interface TraceCandidateDto {
  chunk_id: string;
  article_id: string;
  article_title: string;
  score: number;
  rank: number;
}

export interface FusionTraceItemDto {
  chunk_id: string;
  article_id: string;
  article_title: string;
  score: number;
  normalized_score: number;
  vector_rank: number | null;
  fts_rank: number | null;
}

export interface RerankTraceItemDto {
  chunk_id: string;
  article_id: string;
  article_title: string;
  score: number;
  fused_score_norm: number;
  entity_overlap: number;
  source_reliability: number;
  origins: SearchOriginDto[];
  drop_reason: string | null;
}

export interface RagTraceDto {
  query: {
    original: string;
    normalized: string;
    tokens: string[];
    expansions: string[];
    detected_language: LanguageDto;
    entities: MatchedEntityDto[];
    inferred_filters: InferredFilterDto[];
    years: number[];
    duration_ms: number;
  };
  applied_filters: RagFiltersDto;
  prefilter: {
    corpus_before: number;
    corpus_after: number;
    exclusions: { filter: string; excluded: number }[];
    duration_ms: number;
  };
  vector: SearchTraceDto;
  fts: SearchTraceDto;
  fusion: { k: number; candidates: FusionTraceItemDto[]; duration_ms: number };
  rerank: {
    top_k: number;
    min_score: number;
    kept: RerankTraceItemDto[];
    dropped: RerankTraceItemDto[];
    duration_ms: number;
  };
  context: {
    chunks: number;
    facts: number;
    sources: number;
    token_count: number;
    excluded_facts: number;
    duration_ms: number;
  };
  total_ms: number;
}

export interface SearchTraceDto {
  origin: SearchOriginDto;
  top_n: number;
  candidates: TraceCandidateDto[];
  duration_ms: number;
}

export interface ArticleRefDto {
  article_id: string;
  title: string;
  url: string;
  section_id: string;
  section_title: string;
  language: LanguageDto;
  updated_at: string;
}

export interface RankedResultDto {
  chunk: ChunkDto;
  score: number;
  verification_status: VerificationStatusDto;
  source: SourceDto;
  article_ref: ArticleRefDto;
}

export interface ConfidenceDto {
  score: number;
  level: ConfidenceLevelDto;
  components: { rerank_mean: number; verified_share: number; source_diversity: number };
  reasons: string[];
}

export interface RagContextDto {
  chunks: RankedResultDto[];
  facts: FactDto[];
  sources: SourceDto[];
  confidence: ConfidenceDto;
  token_count: number;
  excluded_total: number;
  excluded_facts: FactDto[];
}

export interface AgentAnswerDto {
  text: string;
  citations: {
    marker: number;
    chunk_id: string;
    article_id: string;
    source_id: string;
    quote: string;
  }[];
  model: string;
  prompt_version: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  duration_ms: number;
}

export interface LowConfidenceDto {
  message: string;
  possible_sources: {
    article_id: string;
    title: string;
    chunk_id: string;
    score: number;
    origins: SearchOriginDto[];
    reason: string;
  }[];
  suggested_actions: { type: SuggestedActionTypeDto; reason: string }[];
}

export interface RagQueryResponseDto {
  trace: RagTraceDto;
  results: RankedResultDto[];
  context: RagContextDto;
  answer: AgentAnswerDto | null;
  low_confidence: LowConfidenceDto | null;
}

export interface CannedQueryDto {
  id: string;
  label: string;
  request: RagQueryRequestDto;
  response: RagQueryResponseDto;
}

export interface TracesSnapshotDto {
  queries: CannedQueryDto[];
}

export interface ApiSnapshotDto {
  articles: ArticleListItemDto[];
  article_topics: Record<string, string[]>;
  details: Record<string, ArticleDetailDto>;
  jobs: Record<string, ProcessingJobDto>;
  queue: QueueItemDto[];
  filters: FilterOptionsDto;
}
