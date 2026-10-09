import { mapChunk } from '@/entities/article';
import { mapFact, mapSource } from '@/entities/knowledge';
import type {
  CannedQuery,
  RagFilters,
  RagRequest,
  RagResult,
  RankedResult,
  RerankCandidate,
  TraceCandidate,
} from '@/entities/rag';
import type { ApiClient } from '@/shared/api';
import type {
  RagFiltersDto,
  RagQueryRequestDto,
  RagQueryResponseDto,
  RankedResultDto,
  RerankTraceItemDto,
  TraceCandidateDto,
} from '@/shared/api/dto';

export const toFiltersDto = (f: RagFilters): RagFiltersDto => ({
  project_id: f.projectId,
  language: f.language,
  source_ids: f.sourceIds,
  topic_ids: f.topicIds,
  entity_ids: f.entityIds,
  article_ids: f.articleIds,
  date_from: f.dateFrom,
  date_to: f.dateTo,
  verification_statuses: f.verificationStatuses,
  exclude_outdated: f.excludeOutdated,
  min_confidence: f.minConfidence,
});

export const fromFiltersDto = (dto: RagFiltersDto): RagFilters => ({
  projectId: dto.project_id,
  language: dto.language,
  sourceIds: dto.source_ids,
  topicIds: dto.topic_ids,
  entityIds: dto.entity_ids,
  articleIds: dto.article_ids,
  dateFrom: dto.date_from,
  dateTo: dto.date_to,
  verificationStatuses: dto.verification_statuses,
  excludeOutdated: dto.exclude_outdated,
  minConfidence: dto.min_confidence,
});

export const toRequestDto = (request: RagRequest): RagQueryRequestDto => ({
  text: request.text,
  filters: toFiltersDto(request.filters),
  top_k: request.topK,
});

const mapCandidate = (dto: TraceCandidateDto): TraceCandidate => ({
  chunkId: dto.chunk_id,
  articleId: dto.article_id,
  articleTitle: dto.article_title,
  score: dto.score,
  rank: dto.rank,
});

const mapRerankItem = (dto: RerankTraceItemDto): RerankCandidate => ({
  chunkId: dto.chunk_id,
  articleId: dto.article_id,
  articleTitle: dto.article_title,
  score: dto.score,
  fusedScoreNorm: dto.fused_score_norm,
  entityOverlap: dto.entity_overlap,
  sourceReliability: dto.source_reliability,
  origins: dto.origins,
  dropReason: dto.drop_reason,
});

const mapRanked = (dto: RankedResultDto): RankedResult => ({
  chunk: mapChunk(dto.chunk),
  score: dto.score,
  verificationStatus: dto.verification_status,
  source: mapSource(dto.source),
  articleRef: {
    articleId: dto.article_ref.article_id,
    title: dto.article_ref.title,
    url: dto.article_ref.url,
    sectionId: dto.article_ref.section_id,
    sectionTitle: dto.article_ref.section_title,
    language: dto.article_ref.language,
    updatedAt: new Date(dto.article_ref.updated_at),
  },
});

export function mapRagResponse(dto: RagQueryResponseDto): RagResult {
  const { trace, context } = dto;
  return {
    trace: {
      query: {
        original: trace.query.original,
        normalized: trace.query.normalized,
        tokens: trace.query.tokens,
        expansions: trace.query.expansions,
        detectedLanguage: trace.query.detected_language,
        entities: trace.query.entities.map((e) => ({
          entityId: e.entity_id,
          name: e.name,
          matchedText: e.matched_text,
        })),
        inferredFilters: trace.query.inferred_filters,
        years: trace.query.years,
        durationMs: trace.query.duration_ms,
      },
      appliedFilters: fromFiltersDto(trace.applied_filters),
      prefilter: {
        corpusBefore: trace.prefilter.corpus_before,
        corpusAfter: trace.prefilter.corpus_after,
        exclusions: trace.prefilter.exclusions,
        durationMs: trace.prefilter.duration_ms,
      },
      vector: {
        topN: trace.vector.top_n,
        candidates: trace.vector.candidates.map(mapCandidate),
        durationMs: trace.vector.duration_ms,
      },
      fts: {
        topN: trace.fts.top_n,
        candidates: trace.fts.candidates.map(mapCandidate),
        durationMs: trace.fts.duration_ms,
      },
      fusion: {
        k: trace.fusion.k,
        candidates: trace.fusion.candidates.map((c) => ({
          chunkId: c.chunk_id,
          articleId: c.article_id,
          articleTitle: c.article_title,
          score: c.score,
          normalizedScore: c.normalized_score,
          vectorRank: c.vector_rank,
          ftsRank: c.fts_rank,
        })),
        durationMs: trace.fusion.duration_ms,
      },
      rerank: {
        topK: trace.rerank.top_k,
        minScore: trace.rerank.min_score,
        kept: trace.rerank.kept.map(mapRerankItem),
        dropped: trace.rerank.dropped.map(mapRerankItem),
        durationMs: trace.rerank.duration_ms,
      },
      context: {
        chunks: trace.context.chunks,
        facts: trace.context.facts,
        sources: trace.context.sources,
        tokenCount: trace.context.token_count,
        excludedFacts: trace.context.excluded_facts,
        durationMs: trace.context.duration_ms,
      },
      totalMs: trace.total_ms,
    },
    results: dto.results.map(mapRanked),
    context: {
      chunks: context.chunks.map(mapRanked),
      facts: context.facts.map(mapFact),
      sources: context.sources.map(mapSource),
      confidence: {
        score: context.confidence.score,
        level: context.confidence.level,
        components: {
          rerankMean: context.confidence.components.rerank_mean,
          verifiedShare: context.confidence.components.verified_share,
          sourceDiversity: context.confidence.components.source_diversity,
        },
        reasons: context.confidence.reasons,
      },
      tokenCount: context.token_count,
      excludedTotal: context.excluded_total,
      excludedFacts: context.excluded_facts.map(mapFact),
    },
    outcome: dto.answer
      ? {
          kind: 'answer',
          answer: {
            text: dto.answer.text,
            citations: dto.answer.citations.map((c) => ({
              marker: c.marker,
              chunkId: c.chunk_id,
              articleId: c.article_id,
              sourceId: c.source_id,
              quote: c.quote,
            })),
            model: dto.answer.model,
            promptVersion: dto.answer.prompt_version,
            tokensIn: dto.answer.tokens_in,
            tokensOut: dto.answer.tokens_out,
            costUsd: dto.answer.cost_usd,
            durationMs: dto.answer.duration_ms,
          },
        }
      : {
          kind: 'low_confidence',
          lowConfidence: {
            message: dto.low_confidence?.message ?? 'Not enough verified information',
            possibleSources: (dto.low_confidence?.possible_sources ?? []).map((s) => ({
              articleId: s.article_id,
              title: s.title,
              chunkId: s.chunk_id,
              score: s.score,
              origins: s.origins,
              reason: s.reason,
            })),
            suggestedActions: dto.low_confidence?.suggested_actions ?? [],
          },
        },
  };
}

export async function runRagQuery(client: ApiClient, request: RagRequest): Promise<RagResult> {
  return mapRagResponse(await client.runRagQuery(toRequestDto(request)));
}

export async function fetchCannedQueries(client: ApiClient): Promise<CannedQuery[]> {
  const canned = await client.listCannedQueries();
  return canned.map((item) => ({
    id: item.id,
    label: item.label,
    request: {
      text: item.request.text,
      filters: fromFiltersDto(item.request.filters),
      topK: item.request.top_k,
    },
  }));
}
