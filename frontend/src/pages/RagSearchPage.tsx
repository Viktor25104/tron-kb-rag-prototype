import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DEFAULT_TOP_K, emptyFilters } from '@/entities/rag';
import {
  PipelineTrace,
  QueryForm,
  ResultsList,
  decodeRequest,
  requestSearch,
  useRagQuery,
} from '@/features/rag-search';
import { ConfidenceLevel } from '@/features/retrieved-context';
import { ErrorBlock, LoadingBlock, PageHeader } from '@/shared/ui';

export function RagSearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const request = decodeRequest(params);
  const query = useRagQuery(request);
  const search = request ? requestSearch(request) : '';

  return (
    <>
      <PageHeader
        title="RAG Search"
        description="Every number below is computed by the pipeline for this query and these filters."
        actions={
          query.data && (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-zinc-600">
                Confidence <ConfidenceLevel confidence={query.data.context.confidence} />
              </span>
              <Link
                to={`/rag/context${search}`}
                className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Build context →
              </Link>
            </div>
          )
        }
      />
      <div className="flex flex-col gap-4">
        <QueryForm
          key={search}
          initial={request ?? { text: '', filters: emptyFilters(), topK: DEFAULT_TOP_K }}
          running={query.isFetching}
          onSubmit={(next) => {
            navigate(`/rag${requestSearch(next)}`);
          }}
        />
        {query.isFetching && <LoadingBlock label="Running pipeline" />}
        {query.isError && <ErrorBlock error={query.error} />}
        {query.data && (
          <div className="grid gap-4 xl:grid-cols-2">
            <PipelineTrace trace={query.data.trace} />
            <ResultsList result={query.data} />
          </div>
        )}
      </div>
    </>
  );
}
