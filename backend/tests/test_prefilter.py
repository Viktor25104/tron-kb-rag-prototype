from dataclasses import replace
from datetime import date

from app.application.prefilter import expand_topics, prefilter
from app.domain.enums import Language, ProcessingStatus, VerificationStatus
from app.domain.models import Topic
from app.domain.rag import RagFilters
from tests.factories import PROJECT, article, chunk, corpus_item

EN = article("art-en", language=Language.EN)
RU = article("art-ru", language=Language.RU)
QUEUED = article("art-queued", status=ProcessingStatus.QUEUED)

CORPUS = [
    corpus_item(chunk("en-1", "art-en"), EN, entity_ids=frozenset({"ent-trc20"})),
    corpus_item(chunk("en-2", "art-en"), EN, verification=VerificationStatus.CONFLICTING),
    corpus_item(chunk("ru-1", "art-ru"), RU, entity_ids=frozenset({"ent-trc20"})),
    corpus_item(chunk("q-1", "art-queued"), QUEUED, entity_ids=frozenset({"ent-trc20"})),
]


def kept_ids(filters: RagFilters) -> list[str]:
    return [item.chunk.id for item in prefilter(CORPUS, filters, []).kept]


def test_only_indexed_chunks_are_searchable() -> None:
    outcome = prefilter(CORPUS, RagFilters(project_id=PROJECT), [])

    assert "q-1" not in [item.chunk.id for item in outcome.kept]
    assert outcome.corpus_before == 4
    assert {e.filter: e.excluded for e in outcome.exclusions}["indexed"] == 1


def test_filters_combine_with_and_semantics() -> None:
    filters = RagFilters(project_id=PROJECT, language=Language.EN, entity_ids=("ent-trc20",))

    assert kept_ids(filters) == ["en-1"]


def test_exclusions_add_up_to_removed_chunks() -> None:
    filters = RagFilters(project_id=PROJECT, language=Language.EN, entity_ids=("ent-trc20",))
    outcome = prefilter(CORPUS, filters, [])

    removed = outcome.corpus_before - len(outcome.kept)
    assert sum(e.excluded for e in outcome.exclusions) == removed


def test_verification_and_date_filters() -> None:
    base = RagFilters(project_id=PROJECT)

    conflicting = replace(base, verification_statuses=(VerificationStatus.CONFLICTING,))
    assert kept_ids(conflicting) == ["en-2"]
    assert kept_ids(replace(base, date_from=date(2030, 1, 1))) == []


def test_other_projects_never_leak_in() -> None:
    assert kept_ids(RagFilters(project_id="another-project")) == []


def test_language_without_indexed_content_yields_empty_corpus() -> None:
    outcome = prefilter(CORPUS, RagFilters(project_id=PROJECT, language=Language.TR), [])

    assert outcome.kept == ()
    assert outcome.corpus_before == 4


def test_topic_filter_includes_descendants() -> None:
    topics = [
        Topic("t-root", PROJECT, "Energy", None),
        Topic("t-child", PROJECT, "Rental", "t-root"),
        Topic("t-other", PROJECT, "Fees", None),
    ]

    assert expand_topics(["t-root"], topics) == {"t-root", "t-child"}
