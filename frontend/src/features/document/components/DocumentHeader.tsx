import { Badge, Panel, StatusPill, formatDate } from '@/shared/ui';
import type { ArticleDetail } from '../api';
import { sourceLookup } from '../model';

export function DocumentHeader({ detail }: { detail: ArticleDetail }) {
  const { article } = detail;
  const source = sourceLookup(detail.sources)(article.sourceId);
  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold text-zinc-900">{article.title}</h1>
            <StatusPill status={article.status} />
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 block truncate text-sm text-sky-700 hover:underline"
          >
            {article.url}
          </a>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <Meta label="Source" value={source?.name ?? article.sourceId} />
            <Meta label="Language" value={article.language} />
            <Meta label="Updated" value={formatDate(article.updatedAt)} />
            <Meta
              label="Chunks"
              value={`${article.embeddedCount}/${article.chunkCount} embedded`}
            />
            <Meta label="Topics" value={detail.topics.map((t) => t.name).join(', ') || '—'} />
          </dl>
        </div>
        <ol className="min-w-64 space-y-1.5 text-sm">
          {[...article.versions].reverse().map((version) => (
            <li key={version.version} className="flex items-baseline gap-2">
              <span className="w-10 font-mono text-xs text-zinc-700">v{version.version}</span>
              <span className="w-24 shrink-0 text-xs text-zinc-500">
                {formatDate(version.releasedAt)}
              </span>
              <span className="text-zinc-700">{version.changeReason}</span>
              {version.isLive && <Badge tone="green">live</Badge>}
            </li>
          ))}
        </ol>
      </div>
    </Panel>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-900">{value}</dd>
    </div>
  );
}
