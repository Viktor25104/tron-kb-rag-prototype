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
} from './dto';

export type ApiMode = 'memory' | 'http';

export interface ApiClient {
  readonly mode: ApiMode;
  listArticles(params?: ArticleListParamsDto): Promise<ArticleListItemDto[]>;
  getArticle(id: string): Promise<ArticleDetailDto>;
  getArticleProcessing(id: string): Promise<ProcessingJobDto>;
  getProcessingQueue(): Promise<QueueItemDto[]>;
  getFilterOptions(): Promise<FilterOptionsDto>;
  runRagQuery(request: RagQueryRequestDto): Promise<RagQueryResponseDto>;
  listCannedQueries(): Promise<Pick<CannedQueryDto, 'id' | 'label' | 'request'>[]>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
