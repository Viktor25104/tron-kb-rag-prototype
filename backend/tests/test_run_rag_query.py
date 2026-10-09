from typing import Any

import pytest

from app.application.use_cases.rag import RunRagQuery
from app.domain.enums import ConfidenceLevel, Language, SearchOrigin
from app.domain.rag import AgentAnswer, RagContext, RagFilters, RagQuery, UnderstoodQuery
from app.infrastructure.agent import TemplateAgent
from app.infrastructure.fixtures import FixtureData, FixtureLoader
from app.infrastructure.latency import SyntheticLatency
from app.infrastructure.repositories import InMemoryArticleRepository, InMemoryKnowledgeRepository
from app.infrastructure.reranker import MockReranker
from app.infrastructure.search import Bm25FullTextSearch, MockVectorSearch

PROJECT = "tron-pool-energy"


class SpyAgent:
    def __init__(self) -> None:
        self.calls: list[tuple[UnderstoodQuery, RagContext]] = []
        self._delegate = TemplateAgent()

    def answer(self, query: UnderstoodQuery, context: RagContext) -> AgentAnswer:
        self.calls.append((query, context))
        return self._delegate.answer(query, context)


def build_use_case(data: FixtureData, agent: SpyAgent) -> RunRagQuery:
    articles = InMemoryArticleRepository(data)
    knowledge = InMemoryKnowledgeRepository(data)
    chunk_sources = {c.id: a.source_id for a in data.articles for c in a.chunks}
    return RunRagQuery(
        articles=articles,
        knowledge=knowledge,
        vector_search=MockVectorSearch(),
        full_text_search=Bm25FullTextSearch(),
        reranker=MockReranker(knowledge, chunk_sources),
        agent=agent,
        latency=SyntheticLatency(),
    )


def canned(query_id: str) -> dict[str, Any]:
    return next(q for q in FixtureLoader().read_queries() if q["id"] == query_id)


def run(data: FixtureData, query_id: str) -> tuple[Any, SpyAgent]:
    item = canned(query_id)
    language = item["filters"].get("language")
    filters = RagFilters(project_id=PROJECT, language=Language(language) if language else None)
    agent = SpyAgent()
    result = build_use_case(data, agent).execute(RagQuery(text=item["text"], filters=filters))
    return result, agent


def test_fee_question_is_answered_with_high_confidence(fixture_data: FixtureData) -> None:
    result, agent = run(fixture_data, "fees-reduce")

    assert result.low_confidence is None
    assert result.answer is not None
    confidence = result.context.confidence
    assert confidence.level is ConfidenceLevel.HIGH
    # Not a perfect score: a fact behind the batching advice is still unverified.
    assert 0.84 <= confidence.score <= 0.89
    assert "1 of 4 facts unverified" in confidence.reasons
    assert confidence.blocked_by == ()
    assert len(agent.calls) == 1
    cited = {c.chunk_id for c in result.answer.citations}
    assert cited <= {r.chunk.id for r in result.context.chunks}
    assert "[1]" in result.answer.text


def test_future_pricing_question_is_refused_without_calling_agent(
    fixture_data: FixtureData,
) -> None:
    result, agent = run(fixture_data, "rental-forecast")

    assert result.answer is None
    assert result.low_confidence is not None
    assert result.context.confidence.level is ConfidenceLevel.LOW
    assert result.context.confidence.blocked_by == ("no evidence dated 2027 or later",)
    # Blocked, not weak: the formula alone would have allowed an answer.
    assert result.context.confidence.score >= 0.6
    assert agent.calls == []
    assert result.low_confidence.possible_sources
    assert all("dropped by reranker" in s.reason for s in result.low_confidence.possible_sources)


def test_language_without_indexed_content_is_refused(fixture_data: FixtureData) -> None:
    result, agent = run(fixture_data, "fees-reduce-tr")

    assert result.low_confidence is not None
    assert agent.calls == []
    assert result.trace.prefilter.corpus_after == 0
    assert result.trace.vector.candidates == ()
    assert result.trace.fts.candidates == ()
    assert result.context.confidence.blocked_by == ("corpus after filters: 0 processed chunks",)


def test_borderline_multisig_question_is_medium(fixture_data: FixtureData) -> None:
    result, _ = run(fixture_data, "multisig-fees")

    assert result.context.confidence.level is ConfidenceLevel.MEDIUM
    assert "single source" in result.context.confidence.reasons


def test_trace_reflects_inferred_filters_and_prefilter(fixture_data: FixtureData) -> None:
    result, _ = run(fixture_data, "fees-reduce")
    trace = result.trace

    inferred = {(f.field, f.value) for f in trace.query.inferred_filters}
    assert ("entity_ids", "ent-trc20") in inferred
    assert ("language", "EN") in inferred
    assert trace.prefilter.corpus_after < trace.prefilter.corpus_before
    searchable = trace.prefilter.corpus_after
    assert len(trace.vector.candidates) <= searchable
    assert trace.vector.origin is SearchOrigin.VECTOR
    assert len(trace.rerank.kept) == len(result.results)


def test_min_confidence_filter_can_force_refusal(fixture_data: FixtureData) -> None:
    item = canned("fees-reduce")
    agent = SpyAgent()
    filters = RagFilters(project_id=PROJECT, min_confidence=0.999)

    result = build_use_case(fixture_data, agent).execute(RagQuery(item["text"], filters))

    assert result.low_confidence is not None
    assert agent.calls == []


@pytest.mark.parametrize("query_id", ["fees-reduce", "rental-forecast", "multisig-fees"])
def test_pipeline_is_deterministic(fixture_data: FixtureData, query_id: str) -> None:
    first, _ = run(fixture_data, query_id)
    second, _ = run(fixture_data, query_id)

    assert first == second


def test_reranker_scores_are_spread_and_ordered(fixture_data: FixtureData) -> None:
    result, _ = run(fixture_data, "fees-reduce")
    scores = [r.score for r in result.results]

    assert scores == sorted(scores, reverse=True)
    assert min(scores) >= 0.72
    assert max(scores) <= 0.95
    assert max(scores) - min(scores) >= 0.08
