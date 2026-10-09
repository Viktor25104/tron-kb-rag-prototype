import type { RagTrace, TraceCandidate } from '@/entities/rag';
import {
  Badge,
  Panel,
  ScoreBar,
  TraceStage,
  formatMs,
  formatNumber,
  formatScore,
} from '@/shared/ui';
import { describeOrigins } from '../model';

const FILTER_LABELS: Record<string, string> = {
  entity_ids: 'entity',
  language: 'language',
};

export function PipelineTrace({ trace }: { trace: RagTrace }) {
  const { query, prefilter, vector, fts, fusion, rerank, context } = trace;
  const excluded = prefilter.exclusions.filter((e) => e.excluded > 0);

  return (
    <Panel
      title="Pipeline trace"
      actions={
        <span className="font-mono text-xs text-zinc-500">total {formatMs(trace.totalMs)}</span>
      }
    >
      <TraceStage
        index={1}
        title="Query Understanding"
        durationMs={query.durationMs}
        defaultOpen
        metrics={[
          { label: 'detected', value: query.detectedLanguage },
          { label: 'entities', value: query.entities.length },
          { label: 'inferred filters', value: query.inferredFilters.length },
        ]}
      >
        <dl className="grid gap-1.5 text-xs">
          <Row label="Normalized">
            <span className="font-mono text-zinc-800">{query.normalized}</span>
          </Row>
          <Row label="Terms">
            <span className="flex flex-wrap gap-1">
              {query.tokens.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
              {query.expansions
                .filter((t) => !query.tokens.includes(t))
                .map((t) => (
                  <Badge key={t} tone="muted" title="Expanded from entity alias">
                    +{t}
                  </Badge>
                ))}
            </span>
          </Row>
          <Row label="Entities">
            {query.entities.length === 0 ? (
              '—'
            ) : (
              <span className="flex flex-wrap gap-1">
                {query.entities.map((e) => (
                  <Badge key={e.entityId} tone="blue">
                    {e.name}
                  </Badge>
                ))}
              </span>
            )}
          </Row>
          <Row label="Inferred">
            {query.inferredFilters.length === 0 ? (
              '—'
            ) : (
              <ul className="space-y-0.5">
                {query.inferredFilters.map((f) => (
                  <li key={`${f.field}-${f.value}`}>
                    <span className="font-medium text-zinc-800">
                      {FILTER_LABELS[f.field] ?? f.field} ={' '}
                      {query.entities.find((e) => e.entityId === f.value)?.name ?? f.value}
                    </span>{' '}
                    <span className="text-zinc-500">({f.reason})</span>
                  </li>
                ))}
              </ul>
            )}
          </Row>
          {query.years.length > 0 && <Row label="Time scope">{query.years.join(', ')}</Row>}
        </dl>
      </TraceStage>

      <TraceStage
        index={2}
        title="Pre-filter"
        durationMs={prefilter.durationMs}
        metrics={[
          {
            label: 'corpus',
            value: `${formatNumber(prefilter.corpusBefore)} → ${formatNumber(prefilter.corpusAfter)} chunks`,
          },
        ]}
      >
        <p className="mb-1.5 text-xs text-zinc-500">
          Applied before any search, so retrievers never see excluded chunks.
        </p>
        <ul className="grid gap-1 text-xs sm:grid-cols-2">
          {excluded.length === 0 && <li className="text-zinc-500">Nothing excluded.</li>}
          {excluded.map((e) => (
            <li key={e.filter} className="flex justify-between rounded bg-zinc-50 px-2 py-1">
              <span className="text-zinc-700">{e.filter.replace('_', ' ')}</span>
              <span className="font-mono text-zinc-900">−{e.excluded}</span>
            </li>
          ))}
        </ul>
      </TraceStage>

      <TraceStage
        index={3}
        title="Vector Search / Full-Text Search"
        durationMs={Math.max(vector.durationMs, fts.durationMs)}
        metrics={[
          { label: 'vector', value: `top-${vector.topN}: ${vector.candidates.length}` },
          { label: 'fts', value: `top-${fts.topN}: ${fts.candidates.length}` },
        ]}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <CandidateColumn
            title="Vector (mock embeddings)"
            durationMs={vector.durationMs}
            items={vector.candidates}
          />
          <CandidateColumn
            title="Full-text (BM25)"
            durationMs={fts.durationMs}
            items={fts.candidates}
          />
        </div>
      </TraceStage>

      <TraceStage
        index={4}
        title="RRF fusion"
        durationMs={fusion.durationMs}
        metrics={[
          { label: 'k', value: fusion.k },
          { label: 'fused', value: fusion.candidates.length },
          {
            label: 'in both lists',
            value: fusion.candidates.filter((c) => c.vectorRank && c.ftsRank).length,
          },
        ]}
      >
        <table className="w-full text-xs">
          <thead className="text-left text-zinc-500">
            <tr>
              <th className="py-1 font-medium">Chunk</th>
              <th className="py-1 text-right font-medium">vec #</th>
              <th className="py-1 text-right font-medium">fts #</th>
              <th className="py-1 pl-3 font-medium">Fused (norm.)</th>
            </tr>
          </thead>
          <tbody>
            {fusion.candidates.map((c) => (
              <tr key={c.chunkId} className="border-t border-zinc-100">
                <td className="py-1">
                  <ChunkRef chunkId={c.chunkId} title={c.articleTitle} />
                </td>
                <td className="py-1 text-right font-mono">{c.vectorRank ?? '—'}</td>
                <td className="py-1 text-right font-mono">{c.ftsRank ?? '—'}</td>
                <td className="py-1 pl-3">
                  <ScoreBar value={c.normalizedScore} label={`RRF ${c.score.toFixed(5)}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TraceStage>

      <TraceStage
        index={5}
        title="Reranking"
        durationMs={rerank.durationMs}
        metrics={[
          { label: 'kept', value: `${rerank.kept.length} of top-${rerank.topK}` },
          { label: 'dropped', value: rerank.dropped.length },
          { label: 'min score', value: formatScore(rerank.minScore) },
        ]}
      >
        <p className="mb-1.5 text-xs text-zinc-500">
          score = 0.6 · fused + 0.3 · entity overlap + 0.1 · source reliability
        </p>
        <ul className="space-y-1 text-xs">
          {[...rerank.kept, ...rerank.dropped].map((c) => (
            <li
              key={c.chunkId}
              className="grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-[1fr_9rem_10rem]"
            >
              <ChunkRef chunkId={c.chunkId} title={c.articleTitle} muted={c.dropReason !== null} />
              <span className="hidden font-mono text-zinc-500 sm:block">
                {formatScore(c.fusedScoreNorm)} / {formatScore(c.entityOverlap)} /{' '}
                {formatScore(c.sourceReliability)}
              </span>
              <ScoreBar
                value={c.score}
                threshold={rerank.minScore}
                label={c.dropReason ?? `kept, ${describeOrigins(c)}`}
              />
            </li>
          ))}
        </ul>
      </TraceStage>

      <TraceStage
        index={6}
        title="Context Builder"
        durationMs={context.durationMs}
        last
        metrics={[
          { label: 'chunks', value: context.chunks },
          { label: 'facts', value: context.facts },
          { label: 'sources', value: context.sources },
          { label: 'tokens', value: `~${formatNumber(context.tokenCount)}` },
          ...(context.excludedFacts > 0
            ? [{ label: 'outdated facts excluded', value: context.excludedFacts }]
            : []),
        ]}
      />
    </Panel>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-2">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-800">{children}</dd>
    </div>
  );
}

function ChunkRef({
  chunkId,
  title,
  muted = false,
}: {
  chunkId: string;
  title: string;
  muted?: boolean;
}) {
  return (
    <span
      className={`flex min-w-0 items-baseline gap-2 ${muted ? 'text-zinc-400' : 'text-zinc-800'}`}
    >
      <span className="shrink-0 font-mono">{chunkId}</span>
      <span className="truncate text-zinc-500">{title}</span>
    </span>
  );
}

function CandidateColumn({
  title,
  durationMs,
  items,
}: {
  title: string;
  durationMs: number;
  items: TraceCandidate[];
}) {
  return (
    <div className="rounded border border-zinc-200">
      <div className="flex justify-between border-b border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700">
        {title}
        <span className="font-mono text-zinc-500">{formatMs(durationMs)}</span>
      </div>
      {items.length === 0 ? (
        <div className="px-2 py-3 text-xs text-zinc-500">
          No candidates above the similarity floor.
        </div>
      ) : (
        <ol className="divide-y divide-zinc-100 text-xs">
          {items.map((c) => (
            <li key={c.chunkId} className="flex items-center gap-2 px-2 py-1">
              <span className="w-5 text-right font-mono text-zinc-400">{c.rank}</span>
              <span className="min-w-0 flex-1">
                <ChunkRef chunkId={c.chunkId} title={c.articleTitle} />
              </span>
              <span className="font-mono text-zinc-700">{c.score.toFixed(2)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
