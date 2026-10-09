import { useState, type ReactNode } from 'react';
import { formatMs } from './format';

export interface TraceMetric {
  label: string;
  value: ReactNode;
}

interface TraceStageProps {
  index: number;
  title: string;
  metrics: TraceMetric[];
  durationMs: number;
  children?: ReactNode;
  defaultOpen?: boolean;
  last?: boolean;
}

export function TraceStage({
  index,
  title,
  metrics,
  durationMs,
  children,
  defaultOpen = false,
  last = false,
}: TraceStageProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="relative flex gap-3">
      <div className="flex flex-col items-center">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white font-mono text-xs text-zinc-600">
          {index}
        </span>
        {!last && <span className="w-px flex-1 bg-zinc-200" aria-hidden />}
      </div>
      <div className={`min-w-0 flex-1 ${last ? '' : 'pb-4'}`}>
        <button
          type="button"
          onClick={() => {
            setOpen((value) => !value);
          }}
          disabled={!children}
          className="flex w-full flex-wrap items-baseline gap-x-4 gap-y-1 text-left disabled:cursor-default"
          aria-expanded={children ? open : undefined}
        >
          <span className="text-sm font-semibold text-zinc-900">
            {children && <span className="mr-1 text-xs text-zinc-400">{open ? '▾' : '▸'}</span>}
            {title}
          </span>
          {metrics.map((metric) => (
            <span key={metric.label} className="text-xs text-zinc-600">
              {metric.label}:{' '}
              <span className="font-medium text-zinc-900 tabular-nums">{metric.value}</span>
            </span>
          ))}
          <span className="ml-auto font-mono text-xs text-zinc-500">{formatMs(durationMs)}</span>
        </button>
        {open && children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
}
