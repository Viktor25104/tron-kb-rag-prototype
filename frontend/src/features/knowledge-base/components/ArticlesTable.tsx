import { useNavigate } from 'react-router-dom';
import type { ArticleListItem } from '@/entities/article';
import type { Source } from '@/entities/knowledge';
import { EmptyState, StatusPill, Table, formatDate, type Column } from '@/shared/ui';
import { isEmbeddingIncomplete } from '../model';

export function ArticlesTable({
  articles,
  sources,
}: {
  articles: ArticleListItem[];
  sources: Source[];
}) {
  const navigate = useNavigate();
  const sourceName = (id: string) => sources.find((s) => s.id === id)?.name ?? id;

  const columns: Column<ArticleListItem>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (a) => <span className="font-medium text-zinc-900">{a.title}</span>,
    },
    { key: 'source', header: 'Source', render: (a) => sourceName(a.sourceId) },
    { key: 'language', header: 'Language', render: (a) => a.language },
    { key: 'status', header: 'Status', render: (a) => <StatusPill status={a.status} /> },
    {
      key: 'updated',
      header: 'Updated',
      render: (a) => <span className="whitespace-nowrap">{formatDate(a.updatedAt)}</span>,
    },
    { key: 'chunks', header: 'Chunks', align: 'right', render: (a) => a.chunkCount || '—' },
    {
      key: 'embeddings',
      header: 'Embeddings',
      align: 'right',
      render: (a) =>
        a.chunkCount === 0 ? (
          '—'
        ) : (
          <span className={isEmbeddingIncomplete(a) ? 'font-medium text-rose-600' : ''}>
            {a.embeddedCount}/{a.chunkCount}
          </span>
        ),
    },
    { key: 'version', header: 'Version', align: 'right', render: (a) => `v${a.version}` },
  ];

  return (
    <Table
      columns={columns}
      rows={articles}
      rowKey={(a) => a.id}
      onRowClick={(a) => {
        navigate(`/kb/articles/${a.id}`);
      }}
      empty={<EmptyState>No articles match these filters.</EmptyState>}
    />
  );
}
