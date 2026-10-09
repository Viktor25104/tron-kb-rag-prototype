from dataclasses import dataclass, field
from datetime import date, datetime

from app.domain.enums import (
    EntityType,
    Language,
    ProcessingStage,
    ProcessingStatus,
    SourceType,
    StageState,
    VerificationStatus,
)


@dataclass(frozen=True, slots=True)
class Source:
    id: str
    project_id: str
    name: str
    type: SourceType
    url: str
    reliability: float


@dataclass(frozen=True, slots=True)
class Entity:
    id: str
    project_id: str
    name: str
    type: EntityType
    aliases: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class Topic:
    id: str
    project_id: str
    name: str
    parent_id: str | None


@dataclass(frozen=True, slots=True)
class Chunk:
    id: str
    project_id: str
    section_id: str
    article_id: str
    text: str
    token_count: int
    embedding_model: str | None
    embedded: bool
    created_at: datetime
    semantic_tags: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class Section:
    id: str
    project_id: str
    article_id: str
    title: str
    order: int
    chunks: tuple[Chunk, ...] = ()


@dataclass(frozen=True, slots=True)
class ArticleVersion:
    version: str
    released_at: date
    change_reason: str
    is_live: bool


@dataclass(frozen=True, slots=True)
class Article:
    id: str
    project_id: str
    title: str
    url: str
    source_id: str
    language: Language
    version: str
    status: ProcessingStatus
    updated_at: datetime
    sections: tuple[Section, ...]
    chunk_count: int
    embedded_count: int
    versions: tuple[ArticleVersion, ...] = ()

    @property
    def chunks(self) -> tuple[Chunk, ...]:
        return tuple(chunk for section in self.sections for chunk in section.chunks)

    def section(self, section_id: str) -> Section | None:
        return next((s for s in self.sections if s.id == section_id), None)


@dataclass(frozen=True, slots=True)
class Fact:
    id: str
    project_id: str
    chunk_id: str
    statement: str
    status: VerificationStatus
    source_id: str | None
    verified_at: datetime | None


@dataclass(frozen=True, slots=True)
class Claim:
    id: str
    project_id: str
    chunk_id: str
    statement: str
    status: VerificationStatus
    source_id: str | None


@dataclass(frozen=True, slots=True)
class StageError:
    stage: ProcessingStage
    message: str
    retries: int
    occurred_at: datetime
    log: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class StageResult:
    stage: ProcessingStage
    state: StageState
    duration_ms: int | None
    counters: dict[str, int] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class ProcessingJob:
    article_id: str
    project_id: str
    status: ProcessingStatus
    current_stage: ProcessingStage | None
    stages: tuple[StageResult, ...]
    error: StageError | None
    updated_at: datetime
