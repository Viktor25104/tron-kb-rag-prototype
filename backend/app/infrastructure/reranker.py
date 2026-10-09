from collections.abc import Mapping, Sequence

from app.application.ports import KnowledgeRepository
from app.domain.rag import FusedCandidate, RerankedCandidate, RerankOutcome, UnderstoodQuery

WEIGHT_FUSED = 0.6
WEIGHT_ENTITY_OVERLAP = 0.3
WEIGHT_RELIABILITY = 0.1


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
        return RerankedCandidate(
            chunk_id=candidate.chunk_id,
            score=WEIGHT_FUSED * candidate.normalized_score
            + WEIGHT_ENTITY_OVERLAP * entity_overlap
            + WEIGHT_RELIABILITY * reliability,
            fused_score_norm=candidate.normalized_score,
            entity_overlap=entity_overlap,
            source_reliability=reliability,
            origins=candidate.origins,
        )
