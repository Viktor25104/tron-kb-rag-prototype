from collections.abc import Sequence

from app.application.confidence import compute_confidence
from app.application.config import MIN_RESULTS_FOR_ANSWER
from app.application.ports import KnowledgeRepository
from app.domain.enums import VerificationStatus
from app.domain.models import Fact, Source
from app.domain.rag import RagContext, RagFilters, RankedResult, UnderstoodQuery


class ContextBuilder:
    """The only place that decides what the agent gets to see."""

    def __init__(self, knowledge: KnowledgeRepository) -> None:
        self._knowledge = knowledge

    def build(
        self,
        ranked: Sequence[RankedResult],
        filters: RagFilters,
        query: UnderstoodQuery,
        corpus_before: int,
        corpus_after: int,
    ) -> RagContext:
        linked = self._knowledge.facts_for_chunks([r.chunk.id for r in ranked])
        excluded = [
            fact
            for fact in linked
            if filters.exclude_outdated and fact.status is VerificationStatus.OUTDATED
        ]
        facts = [fact for fact in linked if fact not in excluded]
        sources = self._collect_sources(ranked, facts)

        reasons = self._context_reasons(ranked, excluded, corpus_after)
        confidence = compute_confidence(
            rerank_scores=[r.score for r in ranked],
            facts=facts,
            source_ids={s.id for s in sources},
            extra_reasons=reasons,
            blocking_reasons=self._coverage_gaps(ranked, facts, query),
        )
        token_count = sum(r.chunk.token_count for r in ranked) + sum(
            len(f.statement) // 4 for f in facts
        )
        return RagContext(
            chunks=tuple(ranked),
            facts=tuple(facts),
            sources=tuple(sources),
            confidence=confidence,
            token_count=token_count,
            excluded_total=corpus_before - len(ranked),
            excluded_facts=tuple(excluded),
        )

    def _collect_sources(
        self, ranked: Sequence[RankedResult], facts: Sequence[Fact]
    ) -> list[Source]:
        sources: dict[str, Source] = {r.source.id: r.source for r in ranked}
        for fact in facts:
            if fact.source_id is None or fact.source_id in sources:
                continue
            source = self._knowledge.source(fact.source_id)
            if source is not None:
                sources[source.id] = source
        return list(sources.values())

    @staticmethod
    def _context_reasons(
        ranked: Sequence[RankedResult], excluded: Sequence[Fact], corpus_after: int
    ) -> list[str]:
        reasons: list[str] = []
        if corpus_after == 0:
            reasons.append("corpus after filters: 0 processed chunks")
        elif len(ranked) < MIN_RESULTS_FOR_ANSWER:
            noun = "result" if len(ranked) == 1 else "results"
            reasons.append(f"only {len(ranked)} {noun} passed reranking")
        if excluded:
            reasons.append(f"{len(excluded)} outdated facts excluded")
        return reasons

    @staticmethod
    def _coverage_gaps(
        ranked: Sequence[RankedResult], facts: Sequence[Fact], query: UnderstoodQuery
    ) -> list[str]:
        # A question about a period no evidence covers (a forecast, typically) cannot be
        # answered from the knowledge base however relevant the retrieved chunks look.
        if not query.years:
            return []
        evidence_years = [r.chunk.created_at.year for r in ranked] + [
            f.verified_at.year for f in facts if f.verified_at is not None
        ]
        requested = max(query.years)
        if evidence_years and max(evidence_years) >= requested:
            return []
        return [f"no evidence dated {requested} or later"]
