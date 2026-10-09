import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { RagResult } from '@/entities/rag';
import { EmptyState, Panel, ScoreBar, StatusPill, formatDate } from '@/shared/ui';
import { describeOrigins } from '../model';

export function ResultsList({ result }: { result: RagResult }) {
  const [showDropped, setShowDropped] = useState(false);
  const { dropped, minScore } = result.trace.rerank;

  return (
    <Panel title={`Results (${result.results.length})`} bodyClassName="">
      {result.results.length === 0 ? (
        <EmptyState>No chunk passed reranking.</EmptyState>
      ) : (
        <ol className="divide-y divide-zinc-100">
          {result.results.map((r, index) => (
            <li key={r.chunk.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 font-mono text-xs text-zinc-400">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed text-zinc-800">{r.chunk.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500">
                    <span>
                      Source <span className="text-zinc-800">{r.source.name}</span>
                    </span>
                    <span>{r.articleRef.language}</span>
                    <span>{formatDate(r.articleRef.updatedAt)}</span>
                    <StatusPill status={r.verificationStatus} />
                    <Link
                      to={`/kb/articles/${r.articleRef.articleId}`}
                      className="text-sky-700 hover:underline"
                    >
                      {r.articleRef.title} · {r.articleRef.sectionTitle}
                    </Link>
                  </div>
                </div>
                <div className="w-40 shrink-0">
                  <div className="mb-0.5 text-right text-[11px] uppercase tracking-wide text-zinc-400">
                    Relevance
                  </div>
                  <ScoreBar value={r.score} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      {dropped.length > 0 && (
        <div className="border-t border-zinc-200">
          <button
            type="button"
            onClick={() => {
              setShowDropped((value) => !value);
            }}
            className="w-full px-4 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-50"
            aria-expanded={showDropped}
          >
            {showDropped ? '▾' : '▸'} Dropped by reranker ({dropped.length})
          </button>
          {showDropped && (
            <ul className="divide-y divide-zinc-100 px-4 pb-3 text-xs">
              {dropped.map((c) => (
                <li key={c.chunkId} className="flex items-center gap-3 py-1.5">
                  <span className="font-mono text-zinc-500">{c.chunkId}</span>
                  <span className="min-w-0 flex-1 truncate text-zinc-600">{c.articleTitle}</span>
                  <span className="text-zinc-500">
                    {describeOrigins(c)} · {c.dropReason}
                  </span>
                  <span className="w-36">
                    <ScoreBar value={c.score} threshold={minScore} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Panel>
  );
}
