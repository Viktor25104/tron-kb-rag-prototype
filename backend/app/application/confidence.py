from collections.abc import Collection, Sequence

from app.application.config import (
    CONFIDENCE_WEIGHT_DIVERSITY,
    CONFIDENCE_WEIGHT_RERANK,
    CONFIDENCE_WEIGHT_VERIFIED,
    HIGH_CONFIDENCE_THRESHOLD,
    MEDIUM_CONFIDENCE_THRESHOLD,
    MIN_RESULTS_FOR_ANSWER,
    SOURCE_DIVERSITY_TARGET,
)
from app.domain.enums import ConfidenceLevel, VerificationStatus
from app.domain.models import Fact
from app.domain.rag import Confidence, ConfidenceComponents


def compute_confidence(
    rerank_scores: Sequence[float],
    facts: Sequence[Fact],
    source_ids: Collection[str],
    extra_reasons: Sequence[str] = (),
    blocking_reasons: Sequence[str] = (),
) -> Confidence:
    # Two strong chunks are not as good as five: slots missing below the minimum
    # answerable result count are averaged in as zeros.
    slots = max(len(rerank_scores), MIN_RESULTS_FOR_ANSWER)
    rerank_mean = sum(rerank_scores) / slots
    verified = sum(1 for fact in facts if fact.status is VerificationStatus.VERIFIED)
    verified_share = verified / len(facts) if facts else 0.0
    source_diversity = min(len(source_ids) / SOURCE_DIVERSITY_TARGET, 1.0)

    score = (
        CONFIDENCE_WEIGHT_RERANK * rerank_mean
        + CONFIDENCE_WEIGHT_VERIFIED * verified_share
        + CONFIDENCE_WEIGHT_DIVERSITY * source_diversity
    )
    return Confidence(
        score=round(score, 4),
        # A blocking reason is a refusal regardless of how strong the components are.
        level=ConfidenceLevel.LOW if blocking_reasons else confidence_level(score),
        components=ConfidenceComponents(
            rerank_mean=round(rerank_mean, 4),
            verified_share=round(verified_share, 4),
            source_diversity=round(source_diversity, 4),
        ),
        reasons=(*extra_reasons, *_reasons(rerank_scores, facts, source_ids)),
        blocked_by=tuple(blocking_reasons),
    )


def confidence_level(score: float) -> ConfidenceLevel:
    if score >= HIGH_CONFIDENCE_THRESHOLD:
        return ConfidenceLevel.HIGH
    if score >= MEDIUM_CONFIDENCE_THRESHOLD:
        return ConfidenceLevel.MEDIUM
    return ConfidenceLevel.LOW


def _reasons(
    rerank_scores: Sequence[float], facts: Sequence[Fact], source_ids: Collection[str]
) -> list[str]:
    reasons: list[str] = []
    if rerank_scores:
        reasons.append(f"top rerank score {max(rerank_scores):.2f}")

    if not facts:
        reasons.append("no facts linked to retrieved chunks")
    else:
        unverified = sum(1 for fact in facts if fact.status is not VerificationStatus.VERIFIED)
        if unverified:
            reasons.append(f"{unverified} of {len(facts)} facts unverified")
        conflicting = sum(1 for fact in facts if fact.status is VerificationStatus.CONFLICTING)
        if conflicting:
            noun = "fact" if conflicting == 1 else "facts"
            reasons.append(f"{conflicting} conflicting {noun}")

    if len(source_ids) == 1:
        reasons.append("single source")
    elif source_ids:
        reasons.append(f"{len(source_ids)} distinct sources")
    return reasons
