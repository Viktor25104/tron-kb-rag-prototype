from collections.abc import Sequence
from typing import Protocol

from app.domain.enums import PipelineStage
from app.domain.models import Article, Chunk, Claim, Entity, Fact, ProcessingJob, Source, Topic
from app.domain.rag import (
    AgentAnswer,
    FusedCandidate,
    RagContext,
    RerankOutcome,
    SearchCandidate,
    UnderstoodQuery,
)


class ArticleRepository(Protocol):
    def list(self, project_id: str) -> list[Article]: ...

    def get(self, article_id: str) -> Article | None: ...


class KnowledgeRepository(Protocol):
    def sources(self, project_id: str) -> list[Source]: ...

    def source(self, source_id: str) -> Source | None: ...

    def entities(self, project_id: str) -> list[Entity]: ...

    def topics(self, project_id: str) -> list[Topic]: ...

    def facts_for_chunks(self, chunk_ids: Sequence[str]) -> list[Fact]: ...

    def claims_for_chunks(self, chunk_ids: Sequence[str]) -> list[Claim]: ...

    def entity_ids_for_chunk(self, chunk_id: str) -> frozenset[str]: ...

    def topic_ids_for_article(self, article_id: str) -> frozenset[str]: ...


class ProcessingRepository(Protocol):
    def list(self, project_id: str) -> list[ProcessingJob]: ...

    def get(self, article_id: str) -> ProcessingJob | None: ...


class VectorSearchPort(Protocol):
    def search(
        self, query: UnderstoodQuery, corpus: Sequence[Chunk], top_n: int
    ) -> list[SearchCandidate]: ...


class FullTextSearchPort(Protocol):
    def search(
        self, query: UnderstoodQuery, corpus: Sequence[Chunk], top_n: int
    ) -> list[SearchCandidate]: ...


class RerankerPort(Protocol):
    def rerank(
        self, query: UnderstoodQuery, candidates: Sequence[FusedCandidate], top_k: int
    ) -> RerankOutcome: ...


class AgentPort(Protocol):
    def answer(self, query: UnderstoodQuery, context: RagContext) -> AgentAnswer: ...


class LatencyModel(Protocol):
    def stage_ms(self, stage: PipelineStage, units: int) -> int: ...
