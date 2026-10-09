from collections.abc import Mapping, Sequence, Set

from app.application.config import MAX_POSSIBLE_SOURCES
from app.domain.enums import SearchOrigin, SuggestedActionType, VerificationStatus
from app.domain.models import Article
from app.domain.rag import (
    LowConfidenceResponse,
    PossibleSource,
    RagContext,
    RerankedCandidate,
    SuggestedAction,
)

LOW_CONFIDENCE_MESSAGE = "Not enough verified information to answer this question"


def build_low_confidence(
    context: RagContext,
    dropped: Sequence[RerankedCandidate],
    articles_by_chunk: Mapping[str, Article],
    filters_applied: bool,
) -> LowConfidenceResponse:
    return LowConfidenceResponse(
        message=LOW_CONFIDENCE_MESSAGE,
        possible_sources=_possible_sources(
            dropped,
            articles_by_chunk,
            kept_article_ids={r.article_ref.article_id for r in context.chunks},
        ),
        suggested_actions=_suggested_actions(context, filters_applied),
    )


def _possible_sources(
    dropped: Sequence[RerankedCandidate],
    articles_by_chunk: Mapping[str, Article],
    kept_article_ids: Set[str],
) -> tuple[PossibleSource, ...]:
    # Articles that already contributed a kept chunk are in the context, not a lead.
    best_per_article: dict[str, RerankedCandidate] = {}
    for candidate in dropped:
        article = articles_by_chunk[candidate.chunk_id]
        if article.id in kept_article_ids:
            continue
        current = best_per_article.get(article.id)
        if current is None or candidate.score > current.score:
            best_per_article[article.id] = candidate

    ordered = sorted(best_per_article.items(), key=lambda item: -item[1].score)
    return tuple(
        PossibleSource(
            article_id=article_id,
            title=articles_by_chunk[candidate.chunk_id].title,
            chunk_id=candidate.chunk_id,
            score=candidate.score,
            origins=candidate.origins,
            reason=(
                f"matched by {_describe_origins(candidate.origins)}, "
                f"dropped by reranker: score {candidate.score:.2f}"
            ),
        )
        for article_id, candidate in ordered[:MAX_POSSIBLE_SOURCES]
    )


def _describe_origins(origins: Sequence[SearchOrigin]) -> str:
    labels = {SearchOrigin.VECTOR: "vector", SearchOrigin.FTS: "FTS"}
    return " + ".join(labels[origin] for origin in origins)


def _suggested_actions(context: RagContext, filters_applied: bool) -> tuple[SuggestedAction, ...]:
    unverified = sum(1 for fact in context.facts if fact.status is not VerificationStatus.VERIFIED)
    broaden_reason = (
        "filters narrowed the corpus before search"
        if filters_applied
        else "query matched too few indexed chunks"
    )
    verification_reason = (
        f"{unverified} related facts are not verified"
        if unverified
        else "no verified facts cover this question"
    )
    return (
        SuggestedAction(SuggestedActionType.BROADEN_FILTERS, broaden_reason),
        SuggestedAction(SuggestedActionType.REQUEST_FACT_VERIFICATION, verification_reason),
        SuggestedAction(
            SuggestedActionType.CREATE_CONTENT_GAP_RECOMMENDATION,
            "the knowledge base has no article that answers this question",
        ),
    )
