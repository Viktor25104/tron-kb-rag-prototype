import { StatusPill, Stat, formatNumber, formatPercent } from '@/shared/ui';
import type { VerificationStatus } from '@/entities/knowledge';
import type { KbSummary } from '../model';

const ORDER: VerificationStatus[] = [
  'VERIFIED',
  'UNVERIFIED',
  'CONFLICTING',
  'OUTDATED',
  'NO_SOURCE',
];

export function KbSummaryCards({ summary }: { summary: KbSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Articles" value={summary.articles} />
      <Stat label="Chunks" value={formatNumber(summary.chunks)} />
      <Stat
        label="Embedded"
        value={formatPercent(summary.embeddedShare)}
        hint={`${formatNumber(summary.embedded)} of ${formatNumber(summary.chunks)} chunks`}
      />
      <Stat
        label="Facts"
        value={summary.factsTotal}
        hint={
          <span className="flex flex-wrap gap-1">
            {ORDER.filter((status) => summary.facts[status] > 0).map((status) => (
              <span key={status} className="inline-flex items-center gap-1">
                <StatusPill status={status} />
                <span className="tabular-nums">{summary.facts[status]}</span>
              </span>
            ))}
          </span>
        }
      />
    </div>
  );
}
