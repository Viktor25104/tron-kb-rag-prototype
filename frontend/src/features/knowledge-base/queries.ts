import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/shared/api';
import { fetchArticles, fetchFilterOptions, type ArticleListFilters } from './api';

export const kbKeys = {
  all: ['kb'] as const,
  articles: (filters: ArticleListFilters) => [...kbKeys.all, 'articles', filters] as const,
  filterOptions: () => [...kbKeys.all, 'filter-options'] as const,
};

export function useArticles(filters: ArticleListFilters) {
  const client = useApiClient();
  return useQuery({
    queryKey: kbKeys.articles(filters),
    queryFn: () => fetchArticles(client, filters),
  });
}

export function useFilterOptions() {
  const client = useApiClient();
  return useQuery({
    queryKey: kbKeys.filterOptions(),
    queryFn: () => fetchFilterOptions(client),
    staleTime: Infinity,
  });
}
