import math
from collections import Counter
from collections.abc import Sequence

from rank_bm25 import BM25Okapi

from app.application.text import tokenize
from app.domain.enums import SearchOrigin
from app.domain.models import Chunk
from app.domain.rag import SearchCandidate, UnderstoodQuery

# semantic_tags stand in for what an embedding model would capture beyond literal
# wording (synonyms, cross-language matches), cosine over term frequencies covers the rest.
TAG_WEIGHT = 0.5
VECTOR_MIN_SIMILARITY = 0.4
FTS_MIN_SCORE = 0.3


class MockVectorSearch:
    def __init__(self) -> None:
        self._vectors: dict[str, Counter[str]] = {}

    def search(
        self, query: UnderstoodQuery, corpus: Sequence[Chunk], top_n: int
    ) -> list[SearchCandidate]:
        query_terms = set(query.tokens)
        if not query_terms:
            return []
        query_vector = Counter(query.tokens)

        scored: list[tuple[float, str]] = []
        for chunk in corpus:
            tag_overlap = len(query_terms & set(chunk.semantic_tags)) / len(query_terms)
            similarity = _cosine(query_vector, self._vector(chunk))
            score = TAG_WEIGHT * tag_overlap + (1 - TAG_WEIGHT) * similarity
            if score >= VECTOR_MIN_SIMILARITY:
                scored.append((score, chunk.id))
        return _to_candidates(scored, SearchOrigin.VECTOR, top_n)

    def _vector(self, chunk: Chunk) -> Counter[str]:
        if chunk.id not in self._vectors:
            self._vectors[chunk.id] = Counter(tokenize(chunk.text))
        return self._vectors[chunk.id]


class _LuceneIdfBM25(BM25Okapi):  # type: ignore[misc]
    # Okapi IDF hits zero or goes negative for terms present in half of the documents,
    # which is common once the corpus is pre-filtered to a handful of chunks.
    def _calc_idf(self, nd: dict[str, int]) -> None:
        for term, freq in nd.items():
            self.idf[term] = math.log(1 + (self.corpus_size - freq + 0.5) / (freq + 0.5))


class Bm25FullTextSearch:
    def search(
        self, query: UnderstoodQuery, corpus: Sequence[Chunk], top_n: int
    ) -> list[SearchCandidate]:
        terms = list(query.search_terms)
        if not corpus or not terms:
            return []
        # The index is built over the pre-filtered corpus on purpose: this mirrors a
        # WHERE clause applied before ts_rank, not a filter applied after retrieval.
        index = _LuceneIdfBM25([tokenize(chunk.text) for chunk in corpus])
        scores = index.get_scores(terms)
        scored = [
            (float(score), chunk.id)
            for score, chunk in zip(scores, corpus, strict=True)
            if score >= FTS_MIN_SCORE
        ]
        return _to_candidates(scored, SearchOrigin.FTS, top_n)


def _to_candidates(
    scored: list[tuple[float, str]], origin: SearchOrigin, top_n: int
) -> list[SearchCandidate]:
    scored.sort(key=lambda item: (-item[0], item[1]))
    return [
        SearchCandidate(chunk_id=chunk_id, score=score, origin=origin, rank=rank)
        for rank, (score, chunk_id) in enumerate(scored[:top_n], start=1)
    ]


def _cosine(left: Counter[str], right: Counter[str]) -> float:
    dot = sum(count * right[term] for term, count in left.items())
    if dot == 0:
        return 0.0
    norm = math.sqrt(sum(v * v for v in left.values())) * math.sqrt(
        sum(v * v for v in right.values())
    )
    return dot / norm
