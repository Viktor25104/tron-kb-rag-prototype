from collections.abc import Mapping, Sequence

from app.application.ports import KnowledgeRepository
from app.domain.rag import FusedCandidate, RerankedCandidate, RerankOutcome, UnderstoodQuery

WEIGHT_FUSED = 0.6
WEIGHT_ENTITY_OVERLAP = 0.3
WEIGHT_RELIABILITY = 0.1
# The weighted sum sits near 1.0 for every candidate found by both retrievers: entity
# overlap is constant after the entity pre-filter and RRF with k=60 barely separates the
# first ranks. A monotonic sharpening, like the temperature on a cross-encoder logit,
# spreads the top of the range without changing the order of any candidate.
SCORE_SHARPNESS = 4


class MockReranker:
    def __init__(self, knowledge: KnowledgeRepository, chunk_sources: Mapping[str, str]) -> None:
        self._knowledge = knowledge
        self._chunk_sources = chunk_sources

    def rerank(
        self, query: UnderstoodQuery, candidates: Sequence[FusedCandidate], top_k: int
    ) -> RerankOutcome:
        scored = [self._score(query, candidate) for candidate in candidates]
        scored.sort(key=lambda c: (-c.score, c.chunk_id))
        return RerankOutcome(kept=tuple(scored[:top_k]), dropped=tuple(scored[top_k:]))

    def _score(self, query: UnderstoodQuery, candidate: FusedCandidate) -> RerankedCandidate:
        query_entities = query.entity_ids
        chunk_entities = self._knowledge.entity_ids_for_chunk(candidate.chunk_id)
        entity_overlap = (
            len(query_entities & chunk_entities) / len(query_entities) if query_entities else 0.0
        )
        source = self._knowledge.source(self._chunk_sources.get(candidate.chunk_id, ""))
        reliability = source.reliability if source else 0.0
        raw = (
            WEIGHT_FUSED * candidate.normalized_score
            + WEIGHT_ENTITY_OVERLAP * entity_overlap
            + WEIGHT_RELIABILITY * reliability
        )
        return RerankedCandidate(
            chunk_id=candidate.chunk_id,
            score=raw**SCORE_SHARPNESS,
            fused_score_norm=candidate.normalized_score,
            entity_overlap=entity_overlap,
            source_reliability=reliability,
            origins=candidate.origins,
        )
