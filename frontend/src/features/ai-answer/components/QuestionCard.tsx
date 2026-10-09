import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { RagResult } from '@/entities/rag';
import { Panel } from '@/shared/ui';

export function QuestionCard({ result, contextLink }: { result: RagResult; contextLink: string }) {
  const [open, setOpen] = useState(false);
  const { context } = result;
  return (
    <div className="flex flex-col gap-4">
      <Panel title="Question">
        <p className="text-sm text-zinc-900">{result.trace.query.original}</p>
      </Panel>
      <Panel
        title="Context"
        actions={
          <button
            type="button"
            onClick={() => {
              setOpen((value) => !value);
            }}
            className="text-xs text-zinc-600 hover:text-zinc-900"
            aria-expanded={open}
          >
            {open ? 'Collapse' : 'Expand'}
          </button>
        }
      >
        <p className="text-sm text-zinc-700">
          {context.chunks.length} chunks · {context.facts.length} facts · {context.sources.length}{' '}
          sources · ~{context.tokenCount} tokens
        </p>
        {open && (
          <ol className="mt-3 space-y-2 text-xs text-zinc-600">
            {context.chunks.map((r, index) => (
              <li key={r.chunk.id}>
                <span className="font-mono text-zinc-400">[{index + 1}]</span> {r.chunk.text}
              </li>
            ))}
          </ol>
        )}
        <Link to={contextLink} className="mt-2 inline-block text-xs text-sky-700 hover:underline">
          Open retrieved context
        </Link>
      </Panel>
    </div>
  );
}
