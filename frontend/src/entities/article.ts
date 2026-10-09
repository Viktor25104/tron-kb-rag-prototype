import type {
  ArticleDto,
  ArticleListItemDto,
  ArticleSummaryDto,
  ArticleVersionDto,
  ChunkDto,
  ProcessingStatusDto,
  SectionDto,
} from '@/shared/api/dto';
import type { Language, VerificationStatus } from './knowledge';

export type ProcessingStatus = ProcessingStatusDto;

export interface Chunk {
  id: string;
  sectionId: string;
  articleId: string;
  text: string;
  tokenCount: number;
  embeddingModel: string | null;
  embedded: boolean;
  createdAt: Date;
  semanticTags: string[];
}

export interface Section {
  id: string;
  title: string;
  order: number;
  chunks: Chunk[];
}

export interface ArticleVersion {
  version: string;
  releasedAt: Date;
  changeReason: string;
  isLive: boolean;
}

export interface ArticleSummary {
  id: string;
  projectId: string;
  title: string;
  url: string;
  sourceId: string;
  language: Language;
  version: string;
  status: ProcessingStatus;
  updatedAt: Date;
  chunkCount: number;
  embeddedCount: number;
}

export interface ArticleListItem extends ArticleSummary {
  factCounts: Record<VerificationStatus, number>;
}

export interface Article extends ArticleSummary {
  sections: Section[];
  versions: ArticleVersion[];
}

export const mapChunk = (dto: ChunkDto): Chunk => ({
  id: dto.id,
  sectionId: dto.section_id,
  articleId: dto.article_id,
  text: dto.text,
  tokenCount: dto.token_count,
  embeddingModel: dto.embedding_model,
  embedded: dto.embedded,
  createdAt: new Date(dto.created_at),
  semanticTags: dto.semantic_tags,
});

const mapSection = (dto: SectionDto): Section => ({
  id: dto.id,
  title: dto.title,
  order: dto.order,
  chunks: dto.chunks.map(mapChunk),
});

const mapVersion = (dto: ArticleVersionDto): ArticleVersion => ({
  version: dto.version,
  releasedAt: new Date(dto.released_at),
  changeReason: dto.change_reason,
  isLive: dto.is_live,
});

export const mapArticleSummary = (dto: ArticleSummaryDto): ArticleSummary => ({
  id: dto.id,
  projectId: dto.project_id,
  title: dto.title,
  url: dto.url,
  sourceId: dto.source_id,
  language: dto.language,
  version: dto.version,
  status: dto.status,
  updatedAt: new Date(dto.updated_at),
  chunkCount: dto.chunk_count,
  embeddedCount: dto.embedded_count,
});

export const mapArticle = (dto: ArticleDto): Article => ({
  ...mapArticleSummary(dto),
  sections: dto.sections.map(mapSection),
  versions: dto.versions.map(mapVersion),
});

export const mapArticleListItem = (dto: ArticleListItemDto): ArticleListItem => ({
  ...mapArticleSummary(dto),
  factCounts: dto.fact_counts,
});
