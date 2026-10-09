import pytest

from app.application.ranking import rrf
from app.domain.enums import SearchOrigin
from tests.factories import hits


def test_single_list_keeps_original_order() -> None:
    fused = rrf([hits(SearchOrigin.VECTOR, "a", "b", "c")], k=60)

    assert [c.chunk_id for c in fused] == ["a", "b", "c"]
    assert fused[0].score == pytest.approx(1 / 61)
    assert fused[2].score == pytest.approx(1 / 63)


def test_chunk_found_by_both_retrievers_outranks_single_list_leaders() -> None:
    vector = hits(SearchOrigin.VECTOR, "only-vector", "shared")
    fts = hits(SearchOrigin.FTS, "only-fts", "shared")

    fused = rrf([vector, fts], k=60)

    assert fused[0].chunk_id == "shared"
    assert fused[0].score == pytest.approx(2 / 62)
    assert fused[0].ranks == {SearchOrigin.VECTOR: 2, SearchOrigin.FTS: 2}
    assert {c.chunk_id for c in fused[1:]} == {"only-vector", "only-fts"}


def test_duplicates_are_merged_not_repeated() -> None:
    fused = rrf([hits(SearchOrigin.VECTOR, "a", "b"), hits(SearchOrigin.FTS, "b", "a")], k=60)

    assert sorted(c.chunk_id for c in fused) == ["a", "b"]
    assert all(c.origins == (SearchOrigin.FTS, SearchOrigin.VECTOR) for c in fused)


def test_k_flattens_the_gap_between_ranks() -> None:
    lists = [hits(SearchOrigin.VECTOR, "a", "b")]

    steep = rrf(lists, k=1)
    flat = rrf(lists, k=1000)

    assert steep[0].score / steep[1].score > flat[0].score / flat[1].score


def test_normalized_score_is_one_for_rank_one_everywhere() -> None:
    fused = rrf([hits(SearchOrigin.VECTOR, "a"), hits(SearchOrigin.FTS, "a")], k=60)

    assert fused[0].normalized_score == pytest.approx(1.0)


def test_ties_are_broken_deterministically() -> None:
    fused = rrf([hits(SearchOrigin.VECTOR, "b"), hits(SearchOrigin.FTS, "a")], k=60)

    assert [c.chunk_id for c in fused] == ["a", "b"]


def test_empty_input() -> None:
    assert rrf([[], []], k=60) == []
