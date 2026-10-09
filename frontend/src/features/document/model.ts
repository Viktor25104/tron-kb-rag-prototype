import type { Entity, Source } from '@/entities/knowledge';
import type { ArticleDetail } from './api';

export function sourceLookup(sources: Source[]) {
  const byId = new Map(sources.map((source) => [source.id, source]));
  return (id: string | null): Source | undefined => (id ? byId.get(id) : undefined);
}

export function entitiesForChunk(detail: ArticleDetail, chunkId: string): Entity[] {
  const ids = new Set(detail.chunkEntities[chunkId] ?? []);
  return detail.entities.filter((entity) => ids.has(entity.id));
}

export function chunkLocator(detail: ArticleDetail, chunkId: string): string {
  for (const section of detail.article.sections) {
    const index = section.chunks.findIndex((chunk) => chunk.id === chunkId);
    if (index >= 0) return `§${section.order}.${index + 1}`;
  }
  return chunkId;
}
