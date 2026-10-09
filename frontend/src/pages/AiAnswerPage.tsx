import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { AgentRunPanel, AnswerBody, LowConfidenceView, QuestionCard } from '@/features/ai-answer';
import { decodeRequest, requestSearch, useCachedRagResult } from '@/features/rag-search';
import { ConfidencePanel, SourcesPanel } from '@/features/retrieved-context';
import { PageHeader } from '@/shared/ui';

export function AiAnswerPage() {
  const [params] = useSearchParams();
  const request = decodeRequest(params);
  const { data } = useCachedRagResult(request);

  if (!request || !data) {
    return <Navigate to={`/rag${request ? requestSearch(request) : ''}`} replace />;
  }

  const search = requestSearch(request);
  const { outcome, context } = data;
  return (
    <>
      <PageHeader
        title="AI Answer"
        actions={
          <Link
            to={`/rag/context${search}`}
            className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            ← Context
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_minmax(0,17rem)]">
        <QuestionCard result={data} contextLink={`/rag/context${search}`} />
        <div className="flex min-w-0 flex-col gap-4">
          {outcome.kind === 'answer' ? (
            <>
              <AnswerBody answer={outcome.answer} context={context} />
              <SourcesPanel context={context} />
            </>
          ) : (
            <LowConfidenceView lowConfidence={outcome.lowConfidence} />
          )}
        </div>
        <div className="flex flex-col gap-4">
          {outcome.kind === 'answer' ? (
            <AgentRunPanel answer={outcome.answer} confidence={context.confidence} />
          ) : (
            <ConfidencePanel confidence={context.confidence} compact />
          )}
        </div>
      </div>
    </>
  );
}
