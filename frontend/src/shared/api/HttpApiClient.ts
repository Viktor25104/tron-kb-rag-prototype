import { ApiError, type ApiClient } from './ApiClient';
import type {
  ArticleDetailDto,
  ArticleListParamsDto,
  ArticleListItemDto,
  CannedQueryDto,
  FilterOptionsDto,
  ProcessingJobDto,
  QueueItemDto,
  RagQueryRequestDto,
  RagQueryResponseDto,
  TracesSnapshotDto,
} from './dto';

export class HttpApiClient implements ApiClient {
  readonly mode = 'http' as const;

  constructor(
    private readonly baseUrl: string,
    private readonly loadTraces: () => Promise<TracesSnapshotDto>,
  ) {}

  listArticles(params: ArticleListParamsDto = {}): Promise<ArticleListItemDto[]> {
    const query = new URLSearchParams(
      Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])),
    );
    const suffix = query.size > 0 ? `?${query.toString()}` : '';
    return this.request(`/articles${suffix}`);
  }

  getArticle(id: string): Promise<ArticleDetailDto> {
    return this.request(`/articles/${encodeURIComponent(id)}`);
  }

  getArticleProcessing(id: string): Promise<ProcessingJobDto> {
    return this.request(`/articles/${encodeURIComponent(id)}/processing`);
  }

  getProcessingQueue(): Promise<QueueItemDto[]> {
    return this.request('/processing/queue');
  }

  getFilterOptions(): Promise<FilterOptionsDto> {
    return this.request('/meta/filters');
  }

  runRagQuery(request: RagQueryRequestDto): Promise<RagQueryResponseDto> {
    return this.request('/rag/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  // Canned queries are only suggestions for the search box; the backend has no endpoint
  // for them, so both clients read the exported list.
  async listCannedQueries(): Promise<Pick<CannedQueryDto, 'id' | 'label' | 'request'>[]> {
    const traces = await this.loadTraces();
    return traces.queries.map(({ id, label, request }) => ({ id, label, request }));
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, init);
    if (!response.ok) {
      throw new ApiError(`${init?.method ?? 'GET'} ${path} failed`, response.status);
    }
    return (await response.json()) as T;
  }
}
