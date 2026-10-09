import {
  mapArticleListItem,
  type ArticleListItem,
  type ProcessingStatus,
} from '@/entities/article';
import { mapFilterOptions, type FilterOptions } from '@/entities/filters';
import type { Language } from '@/entities/knowledge';
import type { ApiClient } from '@/shared/api';

export interface ArticleListFilters {
  language?: Language;
  sourceId?: string;
  status?: ProcessingStatus;
  topicId?: string;
}

export async function fetchArticles(
  client: ApiClient,
  filters: ArticleListFilters,
): Promise<ArticleListItem[]> {
  const items = await client.listArticles({
    language: filters.language,
    source_id: filters.sourceId,
    status: filters.status,
    topic_id: filters.topicId,
  });
  return items.map(mapArticleListItem);
}

export async function fetchFilterOptions(client: ApiClient): Promise<FilterOptions> {
  return mapFilterOptions(await client.getFilterOptions());
}
