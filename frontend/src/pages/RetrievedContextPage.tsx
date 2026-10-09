import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { decodeRequest, requestSearch, useCachedRagResult } from '@/features/rag-search';
import {
  ConfidencePanel,
  FactsPanel,
  RetrievedChunksPanel,
  SourcesPanel,
  contextHeadline,
} from '@/features/retrieved-context';
import { PageHeader } from '@/shared/ui';

export function RetrievedContextPage() {
  const [params] = useSearchParams();
  const request = decodeRequest(params);
  const { data } = useCachedRagResult(request);

  if (!request || !data) {
    return <Navigate to={`/rag${request ? requestSearch(request) : ''}`} replace />;
  }

  const headline = contextHeadline(data.context);
  const search = requestSearch(request);
  return (
    <>
      <PageHeader
        title="Retrieved Context"
        description={
          <>
            <span className="font-medium text-zinc-900">
              {data.outcome.kind === 'answer' ? 'Sent to agent:' : 'Prepared for agent:'}
            </span>{' '}
            {headline.sent}. <span className="font-medium text-zinc-900">Not sent:</span>{' '}
            {headline.notSent}.
            {data.outcome.kind === 'low_confidence' && (
              <span className="ml-1 text-rose-700">Agent not called: confidence is LOW.</span>
            )}
          </>
        }
        actions={
          <div className="flex gap-2">
            <Link
              to={`/rag${search}`}
              className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              ← Trace
            </Link>
            <Link
              to={`/rag/answer${search}`}
              className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Answer →
            </Link>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <RetrievedChunksPanel context={data.context} />
          <FactsPanel context={data.context} />
        </div>
        <div className="flex flex-col gap-4">
          <ConfidencePanel confidence={data.context.confidence} />
          <SourcesPanel context={data.context} />
        </div>
      </div>
    </>
  );
}
