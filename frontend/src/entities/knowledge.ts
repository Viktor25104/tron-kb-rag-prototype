import type {
  ClaimDto,
  EntityDto,
  EntityTypeDto,
  FactDto,
  LanguageDto,
  SourceDto,
  SourceTypeDto,
  TopicDto,
  VerificationStatusDto,
} from '@/shared/api/dto';

export type Language = LanguageDto;
export type VerificationStatus = VerificationStatusDto;
export type SourceType = SourceTypeDto;
export type EntityType = EntityTypeDto;

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  reliability: number;
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  aliases: string[];
}

export interface Topic {
  id: string;
  name: string;
  parentId: string | null;
}

export interface Fact {
  id: string;
  chunkId: string;
  statement: string;
  status: VerificationStatus;
  sourceId: string | null;
  verifiedAt: Date | null;
}

export interface Claim {
  id: string;
  chunkId: string;
  statement: string;
  status: VerificationStatus;
  sourceId: string | null;
}

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  SITE: 'Site',
  TRON_DOCS: 'TRON Docs',
  GSC: 'Search Console',
  GA4: 'GA4',
  AHREFS: 'Ahrefs',
  AI_VISIBILITY: 'AI visibility',
  EXTERNAL: 'External',
};

export const mapSource = (dto: SourceDto): Source => ({ ...dto });

export const mapEntity = (dto: EntityDto): Entity => ({ ...dto });

export const mapTopic = (dto: TopicDto): Topic => ({
  id: dto.id,
  name: dto.name,
  parentId: dto.parent_id,
});

export const mapFact = (dto: FactDto): Fact => ({
  id: dto.id,
  chunkId: dto.chunk_id,
  statement: dto.statement,
  status: dto.status,
  sourceId: dto.source_id,
  verifiedAt: dto.verified_at ? new Date(dto.verified_at) : null,
});

export const mapClaim = (dto: ClaimDto): Claim => ({
  id: dto.id,
  chunkId: dto.chunk_id,
  statement: dto.statement,
  status: dto.status,
  sourceId: dto.source_id,
});
