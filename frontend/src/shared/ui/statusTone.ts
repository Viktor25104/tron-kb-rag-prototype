import type { Tone } from './Badge';

const STATUS_TONES: Record<string, Tone> = {
  PROCESSED: 'green',
  PROCESSING: 'blue',
  QUEUED: 'muted',
  FAILED: 'red',
  COMPLETED: 'green',
  RUNNING: 'blue',
  PENDING: 'muted',
  VERIFIED: 'green',
  UNVERIFIED: 'amber',
  OUTDATED: 'muted',
  CONFLICTING: 'red',
  NO_SOURCE: 'orange',
  HIGH: 'green',
  MEDIUM: 'amber',
  LOW: 'red',
};

export function statusTone(status: string): Tone {
  return STATUS_TONES[status] ?? 'neutral';
}
