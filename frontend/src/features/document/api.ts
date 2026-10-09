import { mapArticle, type Article } from '@/entities/article';
import {
  mapClaim,
  mapEntity,
  mapFact,
  mapSource,
  mapTopic,
  type Claim,
  type Entity,
  type Fact,
  type Source,
  type Topic,
} from '@/entities/knowledge';
import type { ApiClient } from '@/shared/api';

export interface ArticleDetail {
  article: Article;
  facts: Fact[];
  claims: Claim[];
  entities: Entity[];
  topics: Topic[];
  sources: Source[];
  chunkEntities: Record<string, string[]>;
}

export async function fetchArticleDetail(client: ApiClient, id: string): Promise<ArticleDetail> {
  const dto = await client.getArticle(id);
  return {
    article: mapArticle(dto.article),
    facts: dto.facts.map(mapFact),
    claims: dto.claims.map(mapClaim),
    entities: dto.entities.map(mapEntity),
    topics: dto.topics.map(mapTopic),
    sources: dto.sources.map(mapSource),
    chunkEntities: dto.chunk_entities,
  };
}
