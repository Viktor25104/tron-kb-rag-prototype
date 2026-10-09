from dataclasses import dataclass

from app.application.ports import ArticleRepository, KnowledgeRepository
from app.application.prefilter import expand_topics
from app.domain.enums import Language, ProcessingStatus, VerificationStatus
from app.domain.models import Article, Claim, Entity, Fact, Source, Topic


@dataclass(frozen=True, slots=True)
class ArticleFilters:
    project_id: str
    language: Language | None = None
    source_id: str | None = None
    status: ProcessingStatus | None = None
    topic_id: str | None = None


@dataclass(frozen=True, slots=True)
class ArticleListItem:
    article: Article
    fact_counts: dict[VerificationStatus, int]


@dataclass(frozen=True, slots=True)
class ArticleTree:
    article: Article
    facts: tuple[Fact, ...]
    claims: tuple[Claim, ...]
    entities: tuple[Entity, ...]
    topics: tuple[Topic, ...]
    sources: tuple[Source, ...]
    chunk_entities: dict[str, tuple[str, ...]]


class ListArticles:
    def __init__(self, articles: ArticleRepository, knowledge: KnowledgeRepository) -> None:
        self._articles = articles
        self._knowledge = knowledge

    def execute(self, filters: ArticleFilters) -> list[ArticleListItem]:
        topic_ids = (
            expand_topics([filters.topic_id], self._knowledge.topics(filters.project_id))
            if filters.topic_id
            else None
        )
        return [
            ArticleListItem(article, self._fact_counts(article))
            for article in self._articles.list(filters.project_id)
            if (filters.language is None or article.language is filters.language)
            and (filters.source_id is None or article.source_id == filters.source_id)
            and (filters.status is None or article.status is filters.status)
            and (
                topic_ids is None
                or bool(self._knowledge.topic_ids_for_article(article.id) & topic_ids)
            )
        ]

    def _fact_counts(self, article: Article) -> dict[VerificationStatus, int]:
        facts = self._knowledge.facts_for_chunks([chunk.id for chunk in article.chunks])
        return {
            status: sum(1 for f in facts if f.status is status) for status in VerificationStatus
        }


class GetArticleTree:
    def __init__(self, articles: ArticleRepository, knowledge: KnowledgeRepository) -> None:
        self._articles = articles
        self._knowledge = knowledge

    def execute(self, article_id: str) -> ArticleTree | None:
        article = self._articles.get(article_id)
        if article is None:
            return None

        chunk_ids = [chunk.id for chunk in article.chunks]
        facts = self._knowledge.facts_for_chunks(chunk_ids)
        claims = self._knowledge.claims_for_chunks(chunk_ids)
        chunk_entities = {
            chunk_id: tuple(sorted(self._knowledge.entity_ids_for_chunk(chunk_id)))
            for chunk_id in chunk_ids
        }
        linked_entity_ids = {eid for ids in chunk_entities.values() for eid in ids}
        topic_ids = self._knowledge.topic_ids_for_article(article.id)

        source_ids = [article.source_id]
        for source_id in [*(f.source_id for f in facts), *(c.source_id for c in claims)]:
            if source_id is not None and source_id not in source_ids:
                source_ids.append(source_id)
        sources = [s for sid in source_ids if (s := self._knowledge.source(sid)) is not None]

        return ArticleTree(
            article=article,
            facts=tuple(facts),
            claims=tuple(claims),
            entities=tuple(
                e for e in self._knowledge.entities(article.project_id) if e.id in linked_entity_ids
            ),
            topics=tuple(
                t for t in self._knowledge.topics(article.project_id) if t.id in topic_ids
            ),
            sources=tuple(sources),
            chunk_entities=chunk_entities,
        )
