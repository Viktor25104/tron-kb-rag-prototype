import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { AgentAnswer, RagContext } from '@/entities/rag';
import { Panel } from '@/shared/ui';
import { splitAnswer } from '../model';

export function AnswerBody({ answer, context }: { answer: AgentAnswer; context: RagContext }) {
  const [active, setActive] = useState<number | null>(null);
  const byMarker = new Map(answer.citations.map((c) => [c.marker, c]));
  const chunkById = new Map(context.chunks.map((r) => [r.chunk.id, r]));

  return (
    <Panel title="Answer">
      <div className="whitespace-pre-line text-[15px] leading-7 text-zinc-900">
        {splitAnswer(answer.text).map((segment, index) => {
          if (segment.kind === 'text') return <span key={index}>{segment.text}</span>;
          const citation = byMarker.get(segment.marker);
          const ranked = citation ? chunkById.get(citation.chunkId) : undefined;
          return (
            <span key={index} className="relative inline-block">
              <a
                href={`#citation-${segment.marker}`}
                onMouseEnter={() => {
                  setActive(segment.marker);
                }}
                onMouseLeave={() => {
                  setActive(null);
                }}
                onFocus={() => {
                  setActive(segment.marker);
                }}
                onBlur={() => {
                  setActive(null);
                }}
                className="mx-0.5 rounded bg-sky-50 px-1 font-mono text-xs font-semibold text-sky-700 ring-1 ring-sky-200 hover:bg-sky-100"
              >
                [{segment.marker}]
              </a>
              {active === segment.marker && ranked && (
                <span
                  role="tooltip"
                  className="absolute left-0 top-full z-20 mt-1 block w-80 rounded-md border border-zinc-200 bg-white p-3 text-left text-xs leading-relaxed text-zinc-700 shadow-lg"
                >
                  <span className="mb-1 block font-medium text-zinc-900">
                    {ranked.source.name} · {ranked.articleRef.title}
                  </span>
                  {ranked.chunk.text}
                </span>
              )}
            </span>
          );
        })}
      </div>
      <ol className="mt-5 space-y-2 border-t border-zinc-100 pt-3">
        {answer.citations.map((citation) => {
          const ranked = chunkById.get(citation.chunkId);
          return (
            <li
              key={citation.marker}
              id={`citation-${citation.marker}`}
              className="flex gap-2 text-sm"
            >
              <span className="font-mono text-xs text-sky-700">[{citation.marker}]</span>
              <span className="min-w-0">
                <span className="text-zinc-800">{ranked?.source.name}</span>{' '}
                <Link
                  to={`/kb/articles/${citation.articleId}`}
                  className="text-sky-700 hover:underline"
                >
                  {ranked?.articleRef.title} · {ranked?.articleRef.sectionTitle}
                </Link>
                <span className="block text-xs text-zinc-500">“{citation.quote}”</span>
              </span>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
