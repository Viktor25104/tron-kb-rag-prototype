import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArticleTree, DocumentHeader, KnowledgePanel, useArticleDetail } from '@/features/document';
import { ErrorBlock, LoadingBlock } from '@/shared/ui';

export function DocumentPage() {
  const { articleId = '' } = useParams();
  const detail = useArticleDetail(articleId);
  const [highlightedChunkId, setHighlightedChunkId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Link to="/kb" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Knowledge Base
      </Link>
      {detail.isPending && <LoadingBlock />}
      {detail.isError && <ErrorBlock error={detail.error} />}
      {detail.data && (
        <>
          <DocumentHeader detail={detail.data} />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <ArticleTree detail={detail.data} highlightedChunkId={highlightedChunkId} />
            <div className="lg:sticky lg:top-16 lg:self-start">
              <KnowledgePanel detail={detail.data} onSelectChunk={setHighlightedChunkId} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
