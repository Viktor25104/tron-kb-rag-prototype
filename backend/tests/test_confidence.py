import pytest

from app.application.confidence import compute_confidence, confidence_level
from app.application.context_builder import ContextBuilder
from app.application.query_understanding import QueryUnderstanding
from app.domain.enums import ConfidenceLevel, Language, VerificationStatus
from app.domain.models import Fact
from app.domain.rag import ArticleRef, RagFilters, RankedResult
from tests.factories import NOW, PROJECT, FakeKnowledge, chunk, fact, source

VERIFIED = VerificationStatus.VERIFIED
OUTDATED = VerificationStatus.OUTDATED


def test_formula_weights() -> None:
    facts = [fact("f1", "c1"), fact("f2", "c1", VerificationStatus.UNVERIFIED)]

    confidence = compute_confidence([0.8, 0.6, 0.4], facts, {"s1", "s2"})

    expected = 0.5 * 0.6 + 0.3 * 0.5 + 0.2 * (2 / 3)
    assert confidence.score == pytest.approx(expected, abs=1e-4)
    assert confidence.components.rerank_mean == pytest.approx(0.6)
    assert confidence.components.verified_share == pytest.approx(0.5)
    assert confidence.components.source_diversity == pytest.approx(2 / 3, abs=1e-4)


def test_source_diversity_saturates_at_three() -> None:
    confidence = compute_confidence([1.0] * 3, [fact("f", "c")], {"a", "b", "c", "d", "e"})

    assert confidence.components.source_diversity == 1.0
    assert confidence.score == pytest.approx(1.0)


def test_missing_results_count_as_zero_slots() -> None:
    confidence = compute_confidence([0.9], [], {"s1"})

    assert confidence.components.rerank_mean == pytest.approx(0.3)


def test_too_few_results_is_low_even_with_strong_components() -> None:
    facts = [fact("f1", "c1")]

    confidence = compute_confidence([1.0, 1.0], facts, {"a", "b", "c"})

    assert confidence.score >= 0.6
    assert confidence.level is ConfidenceLevel.LOW


@pytest.mark.parametrize(
    ("score", "level"),
    [
        (0.75, ConfidenceLevel.HIGH),
        (0.7499, ConfidenceLevel.MEDIUM),
        (0.6, ConfidenceLevel.MEDIUM),
        (0.5999, ConfidenceLevel.LOW),
    ],
)
def test_level_thresholds(score: float, level: ConfidenceLevel) -> None:
    assert confidence_level(score) is level


def test_reasons_describe_weak_spots() -> None:
    facts = [
        fact("f1", "c1"),
        fact("f2", "c1", VerificationStatus.UNVERIFIED),
        fact("f3", "c1", VerificationStatus.CONFLICTING),
    ]

    reasons = compute_confidence([0.41, 0.3, 0.2], facts, {"s1"}).reasons

    assert "top rerank score 0.41" in reasons
    assert "2 of 3 facts unverified" in reasons
    assert "1 conflicting fact" in reasons
    assert "single source" in reasons


def test_blocking_reason_forces_low_and_leads_the_reasons() -> None:
    confidence = compute_confidence(
        [1.0, 1.0, 1.0],
        [fact("f1", "c1")],
        {"a", "b", "c"},
        blocking_reasons=["no evidence dated 2027 or later"],
    )

    assert confidence.score == pytest.approx(1.0)
    assert confidence.level is ConfidenceLevel.LOW
    assert confidence.reasons[0] == "no evidence dated 2027 or later"


def _builder(facts: list[Fact]) -> ContextBuilder:
    return ContextBuilder(FakeKnowledge(facts=facts, sources=[source("src-1")]))


def _ranked(chunk_id: str) -> RankedResult:
    return RankedResult(
        chunk=chunk(chunk_id),
        score=0.9,
        verification_status=VERIFIED,
        source=source("src-1"),
        article_ref=ArticleRef("art-1", "Article", "u", "sec", "Section", Language.EN, NOW),
    )


def test_exclude_outdated_removes_facts_from_context() -> None:
    builder = _builder([fact("f-ok", "c1"), fact("f-old", "c1", OUTDATED)])
    query = QueryUnderstanding([]).understand("question")
    ranked = [_ranked("c1")]

    strict = builder.build(ranked, RagFilters(PROJECT, exclude_outdated=True), query, 10, 5)
    lenient = builder.build(ranked, RagFilters(PROJECT, exclude_outdated=False), query, 10, 5)

    assert [f.id for f in strict.facts] == ["f-ok"]
    assert [f.id for f in strict.excluded_facts] == ["f-old"]
    assert "1 outdated facts excluded" in strict.confidence.reasons
    assert [f.id for f in lenient.facts] == ["f-ok", "f-old"]
    assert strict.confidence.components.verified_share == 1.0
    assert lenient.confidence.components.verified_share == 0.5


def test_question_about_uncovered_period_is_blocked() -> None:
    builder = _builder([fact("f-ok", "c1")])
    ranked = [_ranked("c1"), _ranked("c2"), _ranked("c3")]

    future = builder.build(
        ranked, RagFilters(PROJECT), QueryUnderstanding([]).understand("cost in 2030"), 10, 5
    )
    past = builder.build(
        ranked, RagFilters(PROJECT), QueryUnderstanding([]).understand("cost in 2025"), 10, 5
    )

    assert future.confidence.level is ConfidenceLevel.LOW
    assert "no evidence dated 2030 or later" in future.confidence.reasons
    assert past.confidence.level is not ConfidenceLevel.LOW
