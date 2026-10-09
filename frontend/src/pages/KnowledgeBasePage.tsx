import { useSearchParams } from 'react-router-dom';
import type { ProcessingStatus } from '@/entities/article';
import type { Language } from '@/entities/knowledge';
import {
  ArticleFiltersBar,
  ArticlesTable,
  KbSummaryCards,
  summarize,
  useArticles,
  useFilterOptions,
  type ArticleListFilters,
} from '@/features/knowledge-base';
import { ErrorBlock, LoadingBlock, PageHeader, Panel } from '@/shared/ui';

function filtersFromParams(params: URLSearchParams): ArticleListFilters {
  return {
    sourceId: params.get('source') ?? undefined,
    language: (params.get('language') as Language | null) ?? undefined,
    status: (params.get('status') as ProcessingStatus | null) ?? undefined,
  };
}

function filtersToParams(filters: ArticleListFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.sourceId) params.set('source', filters.sourceId);
  if (filters.language) params.set('language', filters.language);
  if (filters.status) params.set('status', filters.status);
  return params;
}

export function KnowledgeBasePage() {
  const [params, setParams] = useSearchParams();
  const filters = filtersFromParams(params);
  const all = useArticles({});
  const filtered = useArticles(filters);
  const options = useFilterOptions();

  return (
    <>
      <PageHeader
        title="Knowledge Base"
        description="Articles, their processing state and extracted knowledge for the project."
      />
      <div className="flex flex-col gap-4">
        {all.data && <KbSummaryCards summary={summarize(all.data)} />}
        <Panel bodyClassName="">
          <div className="border-b border-zinc-200 px-4 py-3">
            <ArticleFiltersBar
              value={filters}
              options={options.data}
              onChange={(next) => {
                setParams(filtersToParams(next));
              }}
            />
          </div>
          {filtered.isPending && <LoadingBlock />}
          {filtered.isError && (
            <div className="p-4">
              <ErrorBlock error={filtered.error} />
            </div>
          )}
          {filtered.data && (
            <ArticlesTable articles={filtered.data} sources={options.data?.sources ?? []} />
          )}
        </Panel>
      </div>
    </>
  );
}
