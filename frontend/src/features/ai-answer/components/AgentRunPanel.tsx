import type { AgentAnswer, Confidence } from '@/entities/rag';
import { Panel, StatusPill, formatMs, formatNumber, formatScore, formatUsd } from '@/shared/ui';

export function AgentRunPanel({
  answer,
  confidence,
}: {
  answer: AgentAnswer;
  confidence: Confidence;
}) {
  const rows: [string, React.ReactNode][] = [
    ['Model', answer.model],
    ['Prompt version', answer.promptVersion],
    ['Tokens in', formatNumber(answer.tokensIn)],
    ['Tokens out', formatNumber(answer.tokensOut)],
    ['Cost', formatUsd(answer.costUsd)],
    ['Duration', formatMs(answer.durationMs)],
    [
      'Confidence',
      <span key="confidence" className="flex items-center gap-2">
        <span className="font-mono">{formatScore(confidence.score)}</span>
        <StatusPill status={confidence.level} />
      </span>,
    ],
  ];
  return (
    <Panel title="Agent run">
      <dl className="space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <dt className="text-zinc-500">{label}</dt>
            <dd className="text-right text-zinc-900 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
