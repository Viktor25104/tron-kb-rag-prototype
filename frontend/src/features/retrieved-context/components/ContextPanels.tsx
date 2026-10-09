import { Link } from 'react-router-dom';
import { SOURCE_TYPE_LABELS } from '@/entities/knowledge';
import type { RagContext } from '@/entities/rag';
import { EmptyState, Panel, ScoreBar, StatusPill, formatDate, formatScore } from '@/shared/ui';

export function RetrievedChunksPanel({ context }: { context: RagContext }) {
  return (
    <Panel title={`Retrieved chunks (${context.chunks.length})`} bodyClassName="">
      {context.chunks.length === 0 ? (
        <EmptyState>Nothing passed reranking; the agent would receive no chunks.</EmptyState>
      ) : (
        <ol className="divide-y divide-zinc-100">
          {context.chunks.map((r, index) => (
            <li key={r.chunk.id} className="px-4 py-3">
              <div className="mb-1 flex items-center gap-3 text-xs text-zinc-500">
                <span className="font-mono text-zinc-400">[{index + 1}]</span>
                <span className="font-medium text-zinc-700">{r.source.name}</span>
                <Link
                  to={`/kb/articles/${r.articleRef.articleId}`}
                  className="truncate text-sky-700 hover:underline"
                >
                  {r.articleRef.title}
                </Link>
                <span className="ml-auto w-36">
                  <ScoreBar value={r.score} />
                </span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-800">{r.chunk.text}</p>
              <div className="mt-1 text-xs text-zinc-500">{r.chunk.tokenCount} tokens</div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

export function FactsPanel({ context }: { context: RagContext }) {
  const sourceName = (id: string | null) =>
    context.sources.find((s) => s.id === id)?.name ?? (id ? id : 'no source');
  return (
    <Panel title={`Facts (${context.facts.length})`} bodyClassName="">
      {context.facts.length === 0 ? (
        <EmptyState>No facts are linked to the retrieved chunks.</EmptyState>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {context.facts.map((fact) => (
            <li key={fact.id} className="px-4 py-2.5">
              <p className="text-sm text-zinc-900">{fact.statement}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <StatusPill status={fact.status} />
                <span>{sourceName(fact.sourceId)}</span>
                {fact.verifiedAt && <span>checked {formatDate(fact.verifiedAt)}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {context.excludedFacts.length > 0 && (
        <div className="border-t border-zinc-200 px-4 py-2.5 text-xs text-zinc-500">
          Excluded as outdated:{' '}
          {context.excludedFacts.map((fact) => (
            <span key={fact.id} className="mr-2 line-through">
              {fact.statement}
            </span>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function SourcesPanel({ context }: { context: RagContext }) {
  return (
    <Panel title={`Sources (${context.sources.length})`} bodyClassName="">
      {context.sources.length === 0 ? (
        <EmptyState>No sources.</EmptyState>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 text-right font-medium">Reliability</th>
            </tr>
          </thead>
          <tbody>
            {context.sources.map((source) => (
              <tr key={source.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-2">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-700 hover:underline"
                  >
                    {source.name}
                  </a>
                </td>
                <td className="px-4 py-2 text-zinc-600">{SOURCE_TYPE_LABELS[source.type]}</td>
                <td className="px-4 py-2 text-right font-mono">
                  {formatScore(source.reliability)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
