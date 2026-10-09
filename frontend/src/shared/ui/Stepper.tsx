import type { ReactNode } from 'react';

export type StepState = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface Step {
  key: string;
  label: string;
  state: StepState;
  duration?: ReactNode;
  detail?: ReactNode;
}

const MARKER: Record<StepState, string> = {
  COMPLETED: 'border-emerald-500 bg-emerald-500 text-white',
  RUNNING: 'border-sky-500 bg-white text-sky-600',
  FAILED: 'border-rose-500 bg-rose-500 text-white',
  PENDING: 'border-zinc-300 bg-white text-zinc-400',
};

const SYMBOL: Record<StepState, string> = {
  COMPLETED: '✓',
  RUNNING: '•',
  FAILED: '!',
  PENDING: '',
};

const CONNECTOR: Record<StepState, string> = {
  COMPLETED: 'bg-emerald-400',
  RUNNING: 'bg-zinc-200',
  FAILED: 'bg-zinc-200',
  PENDING: 'bg-zinc-200',
};

export function Stepper({ steps }: { steps: Step[] }) {
  return (
    <ol
      className="grid gap-y-3"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((step, index) => (
        <li key={step.key} className="relative min-w-0 pr-2">
          <div className="flex items-center">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${MARKER[step.state]} ${step.state === 'RUNNING' ? 'animate-pulse' : ''}`}
              aria-label={step.state.toLowerCase()}
            >
              {SYMBOL[step.state]}
            </span>
            {index < steps.length - 1 && (
              <span className={`ml-1 h-0.5 flex-1 ${CONNECTOR[step.state]}`} aria-hidden />
            )}
          </div>
          <div
            className={`mt-1.5 text-xs font-medium ${step.state === 'FAILED' ? 'text-rose-700' : 'text-zinc-800'}`}
          >
            {step.label}
          </div>
          {step.duration && (
            <div className="text-xs tabular-nums text-zinc-500">{step.duration}</div>
          )}
          {step.detail && <div className="mt-0.5 text-xs text-zinc-600">{step.detail}</div>}
        </li>
      ))}
    </ol>
  );
}
