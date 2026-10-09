import { useMemo } from 'react';
import { Badge, EmptyState, Panel, Tree, type TreeNode } from '@/shared/ui';
import type { ArticleDetail } from '../api';
import { entitiesForChunk } from '../model';

interface ArticleTreeProps {
  detail: ArticleDetail;
  highlightedChunkId: string | null;
}

export function ArticleTree({ detail, highlightedChunkId }: ArticleTreeProps) {
  const { article } = detail;
  const nodes = useMemo<TreeNode[]>(
    () => [
      {
        id: article.id,
        label: <span className="font-medium">{article.title}</span>,
        meta: `${article.sections.length} sections`,
        children: article.sections.map((section) => ({
          id: section.id,
          label: section.title,
          meta: section.chunks.length > 0 ? `${section.chunks.length} chunks` : 'not chunked yet',
          children: section.chunks.map((chunk, index) => ({
            id: chunk.id,
            label: (
              <span className="flex items-center gap-2">
                <span className="font-mono text-xs text-zinc-500">
                  {section.order}.{index + 1}
                </span>
                <span className="truncate text-zinc-700">{chunk.text.slice(0, 72)}…</span>
              </span>
            ),
            meta: chunk.embedded ? (
              `${chunk.tokenCount} tok`
            ) : (
              <Badge tone="red">not embedded</Badge>
            ),
            content: (
              <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-sm leading-relaxed text-zinc-800">{chunk.text}</p>
                <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                  <div>
                    tokens <span className="text-zinc-800">{chunk.tokenCount}</span>
                  </div>
                  <div>
                    model <span className="text-zinc-800">{chunk.embeddingModel ?? '—'}</span>
                  </div>
                  <div className="font-mono">{chunk.id}</div>
                </dl>
                <div className="mt-2 flex flex-wrap gap-1">
                  {entitiesForChunk(detail, chunk.id).map((entity) => (
                    <Badge key={entity.id} tone="blue">
                      {entity.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ),
          })),
        })),
      },
    ],
    [article, detail],
  );

  return (
    <Panel title="Structure" bodyClassName="p-2">
      {article.sections.length === 0 ? (
        <EmptyState>Not parsed yet.</EmptyState>
      ) : (
        <Tree
          nodes={nodes}
          highlightedId={highlightedChunkId}
          defaultExpanded={[article.id, ...article.sections.map((s) => s.id)]}
        />
      )}
    </Panel>
  );
}
