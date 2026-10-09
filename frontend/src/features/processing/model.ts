import type { ProcessingJob, ProcessingStage, StageResult } from '@/entities/processing';
import { formatMs, formatNumber, type Step } from '@/shared/ui';

export const STAGE_LABELS: Record<ProcessingStage, string> = {
  PARSING: 'Parsing',
  SECTIONING: 'Sections',
  CHUNKING: 'Chunks',
  KNOWLEDGE_EXTRACTION: 'Facts / Claims / Entities',
  EMBEDDING: 'Embeddings',
  INDEXED: 'Indexed',
};

export function describeCounters(stage: StageResult): string | null {
  const c = stage.counters;
  switch (stage.stage) {
    case 'PARSING':
      return c.characters !== undefined ? `${formatNumber(c.characters)} chars` : null;
    case 'SECTIONING':
      return c.sections !== undefined ? `Sections: ${c.sections}` : null;
    case 'CHUNKING':
      return c.chunks !== undefined ? `Chunks: ${c.chunks}` : null;
    case 'KNOWLEDGE_EXTRACTION':
      return c.facts !== undefined
        ? `Facts: ${c.facts}, Claims: ${c.claims ?? 0}, Entities: ${c.entities ?? 0}`
        : null;
    case 'EMBEDDING':
      return c.embedded !== undefined ? `Embedded: ${c.embedded}/${c.total ?? c.embedded}` : null;
    case 'INDEXED':
      return c.indexed !== undefined ? `Indexed: ${c.indexed}` : null;
  }
}

export function toSteps(job: ProcessingJob): Step[] {
  return job.stages.map((stage) => ({
    key: stage.stage,
    label: STAGE_LABELS[stage.stage],
    state: stage.state,
    duration: stage.durationMs !== null ? formatMs(stage.durationMs) : undefined,
    detail: describeCounters(stage) ?? undefined,
  }));
}

// Retry is a UI-only simulation: the failed stage and everything after it look like a
// fresh run until the simulated attempt ends.
export function asRetrying(job: ProcessingJob): ProcessingJob {
  const failedIndex = job.stages.findIndex((stage) => stage.state === 'FAILED');
  if (failedIndex < 0) return job;
  return {
    ...job,
    status: 'PROCESSING',
    error: null,
    stages: job.stages.map((stage, index) => {
      if (index < failedIndex) return stage;
      return {
        ...stage,
        state: index === failedIndex ? 'RUNNING' : 'PENDING',
        durationMs: null,
        counters: {},
      };
    }),
  };
}
