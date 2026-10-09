import { Badge, type Tone } from './Badge';
import { statusTone } from './statusTone';
import { humanize } from './format';

const DOT_TONES: Record<Tone, string> = {
  neutral: 'bg-zinc-400',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-rose-500',
  blue: 'bg-sky-500',
  violet: 'bg-violet-500',
  orange: 'bg-orange-500',
  muted: 'bg-zinc-300',
};

export function StatusPill({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <Badge tone={tone}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_TONES[tone]}`} aria-hidden />
      {humanize(status)}
    </Badge>
  );
}
