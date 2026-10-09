import type { Confidence } from '@/entities/rag';
import { Panel, ScoreBar, formatScore } from '@/shared/ui';
import { CONFIDENCE_COMPONENTS, CONFIDENCE_WEIGHTS } from '../model';
import { BlockedNote, ConfidenceLevel } from './ConfidenceLevel';

const LEVEL_COLOR = {
  HIGH: 'text-emerald-700',
  MEDIUM: 'text-amber-700',
  LOW: 'text-rose-700',
} as const;

export function ConfidencePanel({
  confidence,
  compact = false,
}: {
  confidence: Confidence;
  compact?: boolean;
}) {
  return (
    <Panel title="Confidence">
      <div className="flex items-baseline gap-3">
        <span
          className={`font-mono text-4xl font-semibold tabular-nums ${LEVEL_COLOR[confidence.level]}`}
        >
          {formatScore(confidence.score)}
        </span>
        <ConfidenceLevel confidence={confidence} />
      </div>
      <BlockedNote confidence={confidence} />
      {!compact && (
        <p className="mt-1 text-xs text-zinc-500">HIGH ≥ 0.75 · MEDIUM ≥ 0.60 · LOW below</p>
      )}
      <ul className="mt-4 space-y-2.5">
        {CONFIDENCE_COMPONENTS.map((component) => {
          const value = confidence.components[component.key];
          const weight = CONFIDENCE_WEIGHTS[component.key];
          return (
            <li key={component.key}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-zinc-700">
                  {component.label} <span className="text-zinc-400">× {weight}</span>
                </span>
                <span className="font-mono text-zinc-500">+{formatScore(value * weight)}</span>
              </div>
              <ScoreBar value={value} label={component.hint} />
            </li>
          );
        })}
      </ul>
      {confidence.reasons.length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-zinc-100 pt-3 text-sm text-zinc-700">
          {confidence.reasons.map((reason) => (
            <li key={reason} className="flex gap-2">
              <span className="text-zinc-400" aria-hidden>
                –
              </span>
              {reason}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
