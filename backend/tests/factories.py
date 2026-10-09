from collections.abc import Sequence
from datetime import UTC, datetime

from app.application.prefilter import CorpusChunk
from app.domain.enums import (
    Language,
    ProcessingStatus,
    SearchOrigin,
    SourceType,
    VerificationStatus,
)
from app.domain.models import Article, Chunk, Claim, Entity, Fact, Section, Source, Topic
from app.domain.rag import SearchCandidate

PROJECT = "test-project"
NOW = datetime(2026, 9, 1, tzinfo=UTC)


def chunk(chunk_id: str, article_id: str = "art-1", text: str = "text") -> Chunk:
    return Chunk(
        id=chunk_id,
        project_id=PROJECT,
        section_id=f"{article_id}-sec",
        article_id=article_id,
        text=text,
        token_count=len(text) // 4,
        embedding_model="test-model",
        embedded=True,
        created_at=NOW,
    )


def article(
    article_id: str = "art-1",
    *,
    language: Language = Language.EN,
    status: ProcessingStatus = ProcessingStatus.PROCESSED,
    source_id: str = "src-1",
    chunks: tuple[Chunk, ...] = (),
    updated_at: datetime = NOW,
) -> Article:
    section = Section(
        id=f"{article_id}-sec",
        project_id=PROJECT,
        article_id=article_id,
        title="Section",
        order=1,
        chunks=chunks,
    )
    return Article(
        id=article_id,
        project_id=PROJECT,
        title=f"Article {article_id}",
        url=f"https://example.test/{article_id}",
        source_id=source_id,
        language=language,
        version="1.0",
        status=status,
        updated_at=updated_at,
        sections=(section,),
        chunk_count=len(chunks),
        embedded_count=len(chunks),
    )


def corpus_item(
    item_chunk: Chunk,
    item_article: Article,
    *,
    entity_ids: frozenset[str] = frozenset(),
    topic_ids: frozenset[str] = frozenset(),
    verification: VerificationStatus = VerificationStatus.VERIFIED,
) -> CorpusChunk:
    return CorpusChunk(item_chunk, item_article, entity_ids, topic_ids, verification)


def fact(
    fact_id: str,
    chunk_id: str,
    status: VerificationStatus = VerificationStatus.VERIFIED,
    source_id: str | None = "src-1",
) -> Fact:
    return Fact(
        id=fact_id,
        project_id=PROJECT,
        chunk_id=chunk_id,
        statement=f"Statement {fact_id}.",
        status=status,
        source_id=source_id,
        verified_at=NOW,
    )


def source(source_id: str = "src-1", reliability: float = 0.9) -> Source:
    return Source(
        id=source_id,
        project_id=PROJECT,
        name=source_id,
        type=SourceType.SITE,
        url="https://example.test",
        reliability=reliability,
    )


def hits(origin: SearchOrigin, *chunk_ids: str) -> list[SearchCandidate]:
    return [
        SearchCandidate(chunk_id=cid, score=1.0 / rank, origin=origin, rank=rank)
        for rank, cid in enumerate(chunk_ids, start=1)
    ]


class FakeKnowledge:
    def __init__(self, facts: Sequence[Fact] = (), sources: Sequence[Source] = ()) -> None:
        self._facts = list(facts)
        self._sources = list(sources)

    def sources(self, project_id: str) -> list[Source]:
        return [s for s in self._sources if s.project_id == project_id]

    def source(self, source_id: str) -> Source | None:
        return next((s for s in self._sources if s.id == source_id), None)

    def facts_for_chunks(self, chunk_ids: Sequence[str]) -> list[Fact]:
        return [f for f in self._facts if f.chunk_id in chunk_ids]

    def claims_for_chunks(self, chunk_ids: Sequence[str]) -> list[Claim]:
        return []

    def entities(self, project_id: str) -> list[Entity]:
        return []

    def topics(self, project_id: str) -> list[Topic]:
        return []

    def entity_ids_for_chunk(self, chunk_id: str) -> frozenset[str]:
        return frozenset()

    def topic_ids_for_article(self, article_id: str) -> frozenset[str]:
        return frozenset()
