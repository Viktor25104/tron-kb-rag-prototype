import type { FilterOptionsDto } from '@/shared/api/dto';
import type { ProcessingStatus } from './article';
import {
  mapEntity,
  mapSource,
  mapTopic,
  type Entity,
  type Language,
  type Source,
  type Topic,
  type VerificationStatus,
} from './knowledge';

export interface FilterOptions {
  projectIds: string[];
  languages: Language[];
  statuses: ProcessingStatus[];
  verificationStatuses: VerificationStatus[];
  sources: Source[];
  topics: Topic[];
  entities: Entity[];
  articles: { id: string; title: string; language: Language }[];
  dateMin: string | null;
  dateMax: string | null;
}

export const mapFilterOptions = (dto: FilterOptionsDto): FilterOptions => ({
  projectIds: dto.project_ids,
  languages: dto.languages,
  statuses: dto.statuses,
  verificationStatuses: dto.verification_statuses,
  sources: dto.sources.map(mapSource),
  topics: dto.topics.map(mapTopic),
  entities: dto.entities.map(mapEntity),
  articles: dto.articles,
  dateMin: dto.date_min,
  dateMax: dto.date_max,
});

export function topicPath(topicId: string, topics: Topic[]): string {
  const byId = new Map(topics.map((topic) => [topic.id, topic]));
  const names: string[] = [];
  let current = byId.get(topicId);
  while (current) {
    names.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return names.join(' / ');
}
