from collections.abc import Callable, Sequence
from dataclasses import dataclass

from app.domain.enums import ProcessingStatus, VerificationStatus
from app.domain.models import Article, Chunk, Topic
from app.domain.rag import FilterExclusion, RagFilters


@dataclass(frozen=True, slots=True)
class CorpusChunk:
    chunk: Chunk
    article: Article
    entity_ids: frozenset[str]
    topic_ids: frozenset[str]
    verification: VerificationStatus


@dataclass(frozen=True, slots=True)
class PrefilterOutcome:
    kept: tuple[CorpusChunk, ...]
    corpus_before: int
    exclusions: tuple[FilterExclusion, ...]


Predicate = Callable[[CorpusChunk], bool]


def prefilter(
    corpus: Sequence[CorpusChunk], filters: RagFilters, topics: Sequence[Topic]
) -> PrefilterOutcome:
    predicates = _build_predicates(filters, topics)
    excluded = {name: 0 for name, _ in predicates}
    kept: list[CorpusChunk] = []
    for item in corpus:
        # Attribute each exclusion to the first filter that rejected the chunk,
        # so the counts in the trace add up to before - after.
        failed = next((name for name, accepts in predicates if not accepts(item)), None)
        if failed is None:
            kept.append(item)
        else:
            excluded[failed] += 1
    return PrefilterOutcome(
        kept=tuple(kept),
        corpus_before=len(corpus),
        exclusions=tuple(FilterExclusion(name, count) for name, count in excluded.items()),
    )


def _build_predicates(filters: RagFilters, topics: Sequence[Topic]) -> list[tuple[str, Predicate]]:
    predicates: list[tuple[str, Predicate]] = [
        (
            "indexed",
            lambda c: c.article.status is ProcessingStatus.PROCESSED and c.chunk.embedded,
        ),
        ("project", lambda c: c.chunk.project_id == filters.project_id),
    ]
    if filters.language is not None:
        language = filters.language
        predicates.append(("language", lambda c: c.article.language is language))
    if filters.source_ids:
        source_ids = frozenset(filters.source_ids)
        predicates.append(("source", lambda c: c.article.source_id in source_ids))
    if filters.topic_ids:
        topic_ids = expand_topics(filters.topic_ids, topics)
        predicates.append(("topic", lambda c: bool(c.topic_ids & topic_ids)))
    if filters.entity_ids:
        entity_ids = frozenset(filters.entity_ids)
        predicates.append(("entity", lambda c: bool(c.entity_ids & entity_ids)))
    if filters.article_ids:
        article_ids = frozenset(filters.article_ids)
        predicates.append(("document", lambda c: c.article.id in article_ids))
    if filters.date_from is not None or filters.date_to is not None:
        date_from, date_to = filters.date_from, filters.date_to
        predicates.append(
            (
                "date_range",
                lambda c: (
                    (date_from is None or c.article.updated_at.date() >= date_from)
                    and (date_to is None or c.article.updated_at.date() <= date_to)
                ),
            )
        )
    if filters.verification_statuses:
        statuses = frozenset(filters.verification_statuses)
        predicates.append(("verification", lambda c: c.verification in statuses))
    return predicates


def expand_topics(topic_ids: Sequence[str], topics: Sequence[Topic]) -> frozenset[str]:
    children: dict[str, list[str]] = {}
    for topic in topics:
        if topic.parent_id is not None:
            children.setdefault(topic.parent_id, []).append(topic.id)
    expanded: set[str] = set()
    stack = list(topic_ids)
    while stack:
        current = stack.pop()
        if current not in expanded:
            expanded.add(current)
            stack.extend(children.get(current, []))
    return frozenset(expanded)
