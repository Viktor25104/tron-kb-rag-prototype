import { useState, type FormEvent } from 'react';
import { useFilterOptions } from '@/features/knowledge-base';
import { type RagRequest } from '@/entities/rag';
import { Button, Panel } from '@/shared/ui';
import { countActiveFilters } from '../model';
import { useCannedQueries } from '../queries';
import { FiltersPanel } from './FiltersPanel';

interface QueryFormProps {
  initial: RagRequest;
  onSubmit: (request: RagRequest) => void;
  running: boolean;
}

export function QueryForm({ initial, onSubmit, running }: QueryFormProps) {
  const [draft, setDraft] = useState<RagRequest>(initial);
  const [filtersOpen, setFiltersOpen] = useState(countActiveFilters(initial.filters) > 0);
  const options = useFilterOptions();
  const canned = useCannedQueries();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (draft.text.trim()) onSubmit({ ...draft, text: draft.text.trim() });
  };

  const activeFilters = countActiveFilters(draft.filters);

  return (
    <Panel bodyClassName="p-4">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            value={draft.text}
            onChange={(e) => {
              setDraft({ ...draft, text: e.target.value });
            }}
            placeholder="Ask the knowledge base…"
            className="min-w-0 flex-1 rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            aria-label="Query"
            list="canned-queries"
          />
          <datalist id="canned-queries">
            {canned.data?.map((q) => (
              <option key={q.id} value={q.request.text} />
            ))}
          </datalist>
          <Button type="submit" variant="primary" disabled={running || !draft.text.trim()}>
            {running ? 'Running…' : 'Run'}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500">Try:</span>
          {canned.data?.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                setDraft(q.request);
                onSubmit(q.request);
              }}
              className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 hover:border-zinc-300 hover:bg-white"
            >
              {q.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setFiltersOpen((open) => !open);
            }}
            className="ml-auto text-xs font-medium text-zinc-700 hover:text-zinc-900"
            aria-expanded={filtersOpen}
          >
            {filtersOpen ? '▾' : '▸'} Filters{activeFilters > 0 ? ` (${activeFilters})` : ''}
          </button>
        </div>
        {filtersOpen && (
          <div className="border-t border-zinc-100 pt-3">
            <FiltersPanel
              value={draft.filters}
              options={options.data}
              onChange={(filters) => {
                setDraft({ ...draft, filters });
              }}
            />
          </div>
        )}
      </form>
    </Panel>
  );
}
