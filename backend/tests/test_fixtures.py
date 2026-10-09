from app.domain.enums import ProcessingStage, ProcessingStatus
from app.domain.models import Claim, Fact
from app.infrastructure.fixtures import FixtureData


def test_references_resolve(fixture_data: FixtureData) -> None:
    chunk_ids = {c.id for a in fixture_data.articles for c in a.chunks}
    source_ids = {s.id for s in fixture_data.sources}
    entity_ids = {e.id for e in fixture_data.entities}
    topic_ids = {t.id for t in fixture_data.topics}
    article_ids = {a.id for a in fixture_data.articles}

    assert {a.source_id for a in fixture_data.articles} <= source_ids
    linked: list[Fact | Claim] = [*fixture_data.facts, *fixture_data.claims]
    for item in linked:
        assert item.chunk_id in chunk_ids, item.id
        assert item.source_id is None or item.source_id in source_ids, item.id
    for chunk_id, entities in fixture_data.chunk_entities.items():
        assert chunk_id in chunk_ids
        assert set(entities) <= entity_ids
    for article_id, topics in fixture_data.article_topics.items():
        assert article_id in article_ids
        assert set(topics) <= topic_ids
    assert all(t.parent_id is None or t.parent_id in topic_ids for t in fixture_data.topics)


def test_every_article_has_a_job_with_consistent_counters(fixture_data: FixtureData) -> None:
    jobs = {job.article_id: job for job in fixture_data.jobs}
    facts_by_chunk = {f.chunk_id for f in fixture_data.facts}

    for article in fixture_data.articles:
        job = jobs[article.id]
        assert job.status is article.status
        extraction = next(s for s in job.stages if s.stage is ProcessingStage.KNOWLEDGE_EXTRACTION)
        if extraction.counters:
            chunk_ids = {c.id for c in article.chunks}
            expected = sum(1 for f in fixture_data.facts if f.chunk_id in chunk_ids)
            assert extraction.counters["facts"] == expected
            assert chunk_ids & facts_by_chunk


def test_failed_job_carries_error(fixture_data: FixtureData) -> None:
    failed = [job for job in fixture_data.jobs if job.status is ProcessingStatus.FAILED]

    assert len(failed) == 1
    assert failed[0].error is not None
    assert failed[0].error.stage is ProcessingStage.EMBEDDING
