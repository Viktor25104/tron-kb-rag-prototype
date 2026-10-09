import { useState, type ReactNode } from 'react';
import { topicPath } from '@/entities/filters';
import { SOURCE_TYPE_LABELS, type VerificationStatus } from '@/entities/knowledge';
import { useFilterOptions } from '@/features/knowledge-base';
import { ProcessingStepper, useProcessingJob } from '@/features/processing';
import {
  Badge,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  StatusPill,
  Tabs,
  formatDate,
  formatScore,
  humanize,
} from '@/shared/ui';
import type { ArticleDetail } from '../api';
import { chunkLocator, sourceLookup } from '../model';

type TabId = 'facts' | 'claims' | 'entities' | 'topics' | 'sources' | 'processing';

interface KnowledgePanelProps {
  detail: ArticleDetail;
  onSelectChunk: (chunkId: string) => void;
}

export function KnowledgePanel({ detail, onSelectChunk }: KnowledgePanelProps) {
  const [tab, setTab] = useState<TabId>('facts');
  const source = sourceLookup(detail.sources);
  const allTopics = useFilterOptions().data?.topics;

  const statements = (
    items: {
      id: string;
      chunkId: string;
      statement: string;
      status: VerificationStatus;
      sourceId: string | null;
      verifiedAt?: Date | null;
    }[],
  ): ReactNode =>
    items.length === 0 ? (
      <EmptyState>Nothing extracted for this article.</EmptyState>
    ) : (
      <ul className="divide-y divide-zinc-100">
        {items.map((item) => (
          <li key={item.id} className="px-4 py-3">
            <p className="text-sm text-zinc-900">{item.statement}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <StatusPill status={item.status} />
              <span>{source(item.sourceId)?.name ?? 'no source'}</span>
              {item.verifiedAt && <span>checked {formatDate(item.verifiedAt)}</span>}
              <button
                type="button"
                onClick={() => {
                  onSelectChunk(item.chunkId);
                }}
                className="ml-auto font-mono text-sky-700 hover:underline"
              >
                {chunkLocator(detail, item.chunkId)}
              </button>
            </div>
          </li>
        ))}
      </ul>
    );

  return (
    <section className="rounded-md border border-zinc-200 bg-white">
      <Tabs<TabId>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'facts', label: 'Facts', count: detail.facts.length },
          { id: 'claims', label: 'Claims', count: detail.claims.length },
          { id: 'entities', label: 'Entities', count: detail.entities.length },
          { id: 'topics', label: 'Topics', count: detail.topics.length },
          { id: 'sources', label: 'Sources', count: detail.sources.length },
          { id: 'processing', label: 'Processing' },
        ]}
      />
      {tab === 'facts' && statements(detail.facts)}
      {tab === 'claims' && statements(detail.claims)}
      {tab === 'entities' && (
        <ul className="divide-y divide-zinc-100">
          {detail.entities.map((entity) => (
            <li key={entity.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="font-medium text-zinc-900">{entity.name}</span>
              <Badge tone="muted">{humanize(entity.type)}</Badge>
              <span className="ml-auto text-xs text-zinc-500">
                {
                  Object.values(detail.chunkEntities).filter((ids) => ids.includes(entity.id))
                    .length
                }{' '}
                chunks
              </span>
            </li>
          ))}
        </ul>
      )}
      {tab === 'topics' && (
        <ul className="divide-y divide-zinc-100">
          {detail.topics.map((topic) => (
            <li key={topic.id} className="px-4 py-2.5 text-sm text-zinc-800">
              {allTopics ? topicPath(topic.id, allTopics) : topic.name}
            </li>
          ))}
        </ul>
      )}
      {tab === 'sources' && (
        <ul className="divide-y divide-zinc-100">
          {detail.sources.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
              <span className="font-medium text-zinc-900">{s.name}</span>
              <Badge tone="muted">{SOURCE_TYPE_LABELS[s.type]}</Badge>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="truncate text-sky-700 hover:underline"
              >
                {s.url}
              </a>
              <span className="ml-auto text-xs text-zinc-500">
                reliability{' '}
                <span className="font-mono text-zinc-800">{formatScore(s.reliability)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {tab === 'processing' && <ProcessingTab articleId={detail.article.id} />}
    </section>
  );
}

function ProcessingTab({ articleId }: { articleId: string }) {
  const job = useProcessingJob(articleId);
  if (job.isPending) return <LoadingBlock />;
  if (job.isError)
    return (
      <div className="p-4">
        <ErrorBlock error={job.error} />
      </div>
    );
  return (
    <div className="p-4">
      <ProcessingStepper job={job.data} />
      {job.data.error && <p className="mt-3 text-sm text-rose-700">{job.data.error.message}</p>}
    </div>
  );
}
