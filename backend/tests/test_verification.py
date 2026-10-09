from app.domain.enums import VerificationStatus as Status
from app.domain.verification import aggregate_status


def test_chunk_without_facts_is_unverified() -> None:
    assert aggregate_status([]) is Status.UNVERIFIED


def test_most_severe_status_wins() -> None:
    assert aggregate_status([Status.VERIFIED, Status.OUTDATED]) is Status.OUTDATED
    assert aggregate_status([Status.OUTDATED, Status.CONFLICTING]) is Status.CONFLICTING
    assert aggregate_status([Status.VERIFIED, Status.VERIFIED]) is Status.VERIFIED
