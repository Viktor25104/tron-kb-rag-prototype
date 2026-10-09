import { formatScore } from './format';

interface ScoreBarProps {
  value: number;
  max?: number;
  label?: string;
  threshold?: number;
}

export function ScoreBar({ value, max = 1, label, threshold }: ScoreBarProps) {
  const width = Math.max(0, Math.min(1, value / max)) * 100;
  const below = threshold !== undefined && value < threshold;
  return (
    <div className="flex min-w-32 items-center gap-2" title={label}>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200">
        <div
          className={`h-full rounded-full ${below ? 'bg-zinc-400' : 'bg-sky-600'}`}
          style={{ width: `${width}%` }}
        />
        {threshold !== undefined && (
          <div
            className="absolute top-0 h-full w-px bg-zinc-700"
            style={{ left: `${(threshold / max) * 100}%` }}
            aria-hidden
          />
        )}
      </div>
      <span className="w-9 text-right font-mono text-xs tabular-nums text-zinc-700">
        {formatScore(value)}
      </span>
    </div>
  );
}
