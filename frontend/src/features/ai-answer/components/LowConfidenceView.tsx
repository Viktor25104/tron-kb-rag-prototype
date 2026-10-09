import { Link } from 'react-router-dom';
import type { LowConfidence } from '@/entities/rag';
import { Button, EmptyState, Panel, useToast } from '@/shared/ui';
import { ACTION_LABELS, ACTION_TOASTS } from '../model';

export function LowConfidenceView({ lowConfidence }: { lowConfidence: LowConfidence }) {
  const { notify } = useToast();
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-rose-200 bg-rose-50 px-5 py-6">
        <h2 className="text-lg font-semibold text-rose-900">{lowConfidence.message}</h2>
        <p className="mt-1 text-sm text-rose-800">
          The agent was not called. Confidence is below the answer threshold, so returning a
          generated answer would mean guessing.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {lowConfidence.suggestedActions.map((action) => (
            <span key={action.type} title={action.reason}>
              <Button
                onClick={() => {
                  notify(ACTION_TOASTS[action.type]);
                }}
              >
                {ACTION_LABELS[action.type]}
              </Button>
            </span>
          ))}
        </div>
      </div>
      <Panel title="Possible sources" bodyClassName="">
        {lowConfidence.possibleSources.length === 0 ? (
          <EmptyState>No candidates reached the reranker.</EmptyState>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {lowConfidence.possibleSources.map((source) => (
              <li
                key={source.articleId}
                className="flex flex-wrap items-baseline gap-x-3 px-4 py-2.5 text-sm"
              >
                <Link
                  to={`/kb/articles/${source.articleId}`}
                  className="font-medium text-sky-700 hover:underline"
                >
                  {source.title}
                </Link>
                <span className="text-xs text-zinc-500">{source.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
