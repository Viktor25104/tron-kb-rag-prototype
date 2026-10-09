import type {
  ProcessingJobDto,
  ProcessingStageDto,
  QueueItemDto,
  StageStateDto,
} from '@/shared/api/dto';
import { mapArticleSummary, type ArticleSummary, type ProcessingStatus } from './article';

export type ProcessingStage = ProcessingStageDto;
export type StageState = StageStateDto;

export interface StageResult {
  stage: ProcessingStage;
  state: StageState;
  durationMs: number | null;
  counters: Record<string, number>;
}

export interface StageError {
  stage: ProcessingStage;
  message: string;
  retries: number;
  occurredAt: Date;
  log: string[];
}

export interface ProcessingJob {
  articleId: string;
  status: ProcessingStatus;
  currentStage: ProcessingStage | null;
  stages: StageResult[];
  error: StageError | null;
  updatedAt: Date;
}

export interface QueueItem {
  job: ProcessingJob;
  article: ArticleSummary;
}

export const mapProcessingJob = (dto: ProcessingJobDto): ProcessingJob => ({
  articleId: dto.article_id,
  status: dto.status,
  currentStage: dto.current_stage,
  stages: dto.stages.map((stage) => ({
    stage: stage.stage,
    state: stage.state,
    durationMs: stage.duration_ms,
    counters: stage.counters,
  })),
  error: dto.error
    ? {
        stage: dto.error.stage,
        message: dto.error.message,
        retries: dto.error.retries,
        occurredAt: new Date(dto.error.occurred_at),
        log: dto.error.log,
      }
    : null,
  updatedAt: new Date(dto.updated_at),
});

export const mapQueueItem = (dto: QueueItemDto): QueueItem => ({
  job: mapProcessingJob(dto.job),
  article: mapArticleSummary(dto.article),
});
