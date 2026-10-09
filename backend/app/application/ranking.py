from collections.abc import Sequence

from app.domain.enums import SearchOrigin
from app.domain.rag import FusedCandidate, SearchCandidate


def rrf(candidate_lists: Sequence[Sequence[SearchCandidate]], k: int = 60) -> list[FusedCandidate]:
    scores: dict[str, float] = {}
    ranks: dict[str, dict[SearchOrigin, int]] = {}
    for candidates in candidate_lists:
        for position, candidate in enumerate(candidates, start=1):
            scores[candidate.chunk_id] = scores.get(candidate.chunk_id, 0.0) + 1.0 / (k + position)
            ranks.setdefault(candidate.chunk_id, {})[candidate.origin] = position

    # RRF scores depend only on ranks, so normalising by the best possible score
    # (rank 1 in every list) keeps them comparable across queries.
    best_possible = len(candidate_lists) / (k + 1) if candidate_lists else 1.0
    fused = [
        FusedCandidate(
            chunk_id=chunk_id,
            score=score,
            normalized_score=score / best_possible,
            ranks=ranks[chunk_id],
        )
        for chunk_id, score in scores.items()
    ]
    fused.sort(key=lambda c: (-c.score, c.chunk_id))
    return fused
