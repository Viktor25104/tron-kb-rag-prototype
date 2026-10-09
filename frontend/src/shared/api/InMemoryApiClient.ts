import { ApiError, type ApiClient } from './ApiClient';
import { findCannedQuery } from './cannedMatch';
import type {
  ApiSnapshotDto,
  ArticleDetailDto,
  ArticleListParamsDto,
  ArticleListItemDto,
  CannedQueryDto,
  FilterOptionsDto,
  ProcessingJobDto,
  QueueItemDto,
  RagQueryRequestDto,
  RagQueryResponseDto,
  TopicDto,
  TracesSnapshotDto,
} from './dto';

export const MEMORY_MODE_MESSAGE =
  'Memory mode replays pre-computed pipeline runs. This query and filter combination was not ' +
  'exported; run the backend (VITE_API_MODE=http) to execute arbitrary queries.';

export class InMemoryApiClient implements ApiClient {
  readonly mode = 'memory' as const;

  constructor(
    private readonly loadSnapshot: () => Promise<ApiSnapshotDto>,
    private readonly loadTraces: () => Promise<TracesSnapshotDto>,
  ) {}

  async listArticles(params: ArticleListParamsDto = {}): Promise<ArticleListItemDto[]> {
    const snapshot = await this.loadSnapshot();
    const topicIds = params.topic_id
      ? withDescendants(params.topic_id, snapshot.filters.topics)
      : null;
    return snapshot.articles.filter(
      (article) =>
        (!params.language || article.language === params.language) &&
        (!params.source_id || article.source_id === params.source_id) &&
        (!params.status || article.status === params.status) &&
        (topicIds === null ||
          (snapshot.article_topics[article.id] ?? []).some((id) => topicIds.has(id))),
    );
  }

  async getArticle(id: string): Promise<ArticleDetailDto> {
    const detail = (await this.loadSnapshot()).details[id];
    if (!detail) throw new ApiError(`Article ${id} not found`, 404);
    return detail;
  }

  async getArticleProcessing(id: string): Promise<ProcessingJobDto> {
    const job = (await this.loadSnapshot()).jobs[id];
    if (!job) throw new ApiError(`No processing job for ${id}`, 404);
    return job;
  }

  async getProcessingQueue(): Promise<QueueItemDto[]> {
    return (await this.loadSnapshot()).queue;
  }

  async getFilterOptions(): Promise<FilterOptionsDto> {
    return (await this.loadSnapshot()).filters;
  }

  async runRagQuery(request: RagQueryRequestDto): Promise<RagQueryResponseDto> {
    const { queries } = await this.loadTraces();
    const match = findCannedQuery(request, queries);
    return match ? match.response : notExportedResponse(request);
  }

  async listCannedQueries(): Promise<Pick<CannedQueryDto, 'id' | 'label' | 'request'>[]> {
    const { queries } = await this.loadTraces();
    return queries.map(({ id, label, request }) => ({ id, label, request }));
  }
}

function withDescendants(rootId: string, topics: TopicDto[]): Set<string> {
  const result = new Set<string>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const topic of topics) {
      if (topic.parent_id && result.has(topic.parent_id) && !result.has(topic.id)) {
        result.add(topic.id);
        grew = true;
      }
    }
  }
  return result;
}

export function notExportedResponse(request: RagQueryRequestDto): RagQueryResponseDto {
  const emptySearch = { top_n: 20, candidates: [], duration_ms: 0 };
  return {
    trace: {
      query: {
        original: request.text,
        normalized: request.text.trim().toLowerCase(),
        tokens: [],
        expansions: [],
        detected_language: request.filters.language ?? 'EN',
        entities: [],
        inferred_filters: [],
        years: [],
        duration_ms: 0,
      },
      applied_filters: request.filters,
      prefilter: { corpus_before: 0, corpus_after: 0, exclusions: [], duration_ms: 0 },
      vector: { origin: 'vector', ...emptySearch },
      fts: { origin: 'fts', ...emptySearch },
      fusion: { k: 60, candidates: [], duration_ms: 0 },
      rerank: { top_k: request.top_k, min_score: 0, kept: [], dropped: [], duration_ms: 0 },
      context: {
        chunks: 0,
        facts: 0,
        sources: 0,
        token_count: 0,
        excluded_facts: 0,
        duration_ms: 0,
      },
      total_ms: 0,
    },
    results: [],
    context: {
      chunks: [],
      facts: [],
      sources: [],
      confidence: {
        score: 0,
        level: 'LOW',
        components: { rerank_mean: 0, verified_share: 0, source_diversity: 0 },
        reasons: ['memory mode: no pre-computed run for this query'],
      },
      token_count: 0,
      excluded_total: 0,
      excluded_facts: [],
    },
    answer: null,
    low_confidence: {
      message: MEMORY_MODE_MESSAGE,
      possible_sources: [],
      suggested_actions: [
        {
          type: 'broaden_filters',
          reason: 'try one of the suggested queries with default filters',
        },
      ],
    },
  };
}
