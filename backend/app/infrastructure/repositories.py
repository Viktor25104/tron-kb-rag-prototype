from collections.abc import Sequence

from app.domain.models import Article, Claim, Entity, Fact, ProcessingJob, Source, Topic
from app.infrastructure.fixtures import FixtureData


class InMemoryArticleRepository:
    def __init__(self, data: FixtureData) -> None:
        self._articles = {article.id: article for article in data.articles}

    def list(self, project_id: str) -> list[Article]:
        return [a for a in self._articles.values() if a.project_id == project_id]

    def get(self, article_id: str) -> Article | None:
        return self._articles.get(article_id)


class InMemoryKnowledgeRepository:
    def __init__(self, data: FixtureData) -> None:
        self._sources = {source.id: source for source in data.sources}
        self._entities = data.entities
        self._topics = data.topics
        self._facts_by_chunk = _group_by_chunk(data.facts)
        self._claims_by_chunk = _group_by_chunk(data.claims)
        self._chunk_entities = {k: frozenset(v) for k, v in data.chunk_entities.items()}
        self._article_topics = {k: frozenset(v) for k, v in data.article_topics.items()}

    def sources(self, project_id: str) -> list[Source]:
        return [s for s in self._sources.values() if s.project_id == project_id]

    def source(self, source_id: str) -> Source | None:
        return self._sources.get(source_id)

    def entities(self, project_id: str) -> list[Entity]:
        return [e for e in self._entities if e.project_id == project_id]

    def topics(self, project_id: str) -> list[Topic]:
        return [t for t in self._topics if t.project_id == project_id]

    def facts_for_chunks(self, chunk_ids: Sequence[str]) -> list[Fact]:
        return [fact for cid in chunk_ids for fact in self._facts_by_chunk.get(cid, [])]

    def claims_for_chunks(self, chunk_ids: Sequence[str]) -> list[Claim]:
        return [claim for cid in chunk_ids for claim in self._claims_by_chunk.get(cid, [])]

    def entity_ids_for_chunk(self, chunk_id: str) -> frozenset[str]:
        return self._chunk_entities.get(chunk_id, frozenset())

    def topic_ids_for_article(self, article_id: str) -> frozenset[str]:
        return self._article_topics.get(article_id, frozenset())


class InMemoryProcessingRepository:
    def __init__(self, data: FixtureData) -> None:
        self._jobs = {job.article_id: job for job in data.jobs}

    def list(self, project_id: str) -> list[ProcessingJob]:
        return [job for job in self._jobs.values() if job.project_id == project_id]

    def get(self, article_id: str) -> ProcessingJob | None:
        return self._jobs.get(article_id)


def _group_by_chunk[T: (Fact, Claim)](items: Sequence[T]) -> dict[str, list[T]]:
    grouped: dict[str, list[T]] = {}
    for item in items:
        grouped.setdefault(item.chunk_id, []).append(item)
    return grouped
