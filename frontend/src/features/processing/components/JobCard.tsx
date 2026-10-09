import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { QueueItem } from '@/entities/processing';
import { Button, StatusPill, formatDateTime, useToast } from '@/shared/ui';
import { STAGE_LABELS, asRetrying } from '../model';
import { ProcessingStepper } from './ProcessingStepper';

const RETRY_SIMULATION_MS = 2000;

export function JobCard({ item }: { item: QueueItem }) {
  const { notify } = useToast();
  const [retrying, setRetrying] = useState(false);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    if (!retrying) return;
    const timer = window.setTimeout(() => {
      setRetrying(false);
      notify(`Retry of ${item.article.title} finished: provider still unavailable (simulated)`);
    }, RETRY_SIMULATION_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [retrying, item.article.title, notify]);

  const job = retrying ? asRetrying(item.job) : item.job;
  const error = job.error;

  return (
    <article
      className={`rounded-md border bg-white ${error ? 'border-rose-200' : 'border-zinc-200'}`}
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-zinc-100 px-4 py-2.5">
        <Link
          to={`/kb/articles/${item.article.id}`}
          className="text-sm font-semibold text-zinc-900 hover:underline"
        >
          {item.article.title}
        </Link>
        <span className="text-xs text-zinc-500">
          {item.article.language} · v{item.article.version}
        </span>
        <StatusPill status={job.status} />
        <span className="ml-auto text-xs text-zinc-500">
          Updated {formatDateTime(job.updatedAt)}
        </span>
      </header>
      <div className="px-4 py-3">
        <ProcessingStepper job={job} />
        {error && (
          <div className="mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-rose-800">
                {STAGE_LABELS[error.stage]} failed: {error.message}
              </span>
              <span className="ml-auto flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    setRetrying(true);
                  }}
                >
                  Retry stage
                </Button>
                <Button
                  onClick={() => {
                    setShowLog((value) => !value);
                  }}
                >
                  {showLog ? 'Hide log' : 'View log'}
                </Button>
              </span>
            </div>
            {showLog && (
              <pre className="mt-2 overflow-x-auto rounded bg-zinc-900 p-3 text-xs leading-relaxed text-zinc-100">
                {error.log.join('\n')}
              </pre>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
