from collections.abc import Iterable

from app.domain.enums import VerificationStatus

# A chunk is only as trustworthy as its weakest fact, so the most severe status wins.
_SEVERITY: dict[VerificationStatus, int] = {
    VerificationStatus.CONFLICTING: 4,
    VerificationStatus.OUTDATED: 3,
    VerificationStatus.NO_SOURCE: 2,
    VerificationStatus.UNVERIFIED: 1,
    VerificationStatus.VERIFIED: 0,
}


def aggregate_status(statuses: Iterable[VerificationStatus]) -> VerificationStatus:
    collected = list(statuses)
    if not collected:
        return VerificationStatus.UNVERIFIED
    return max(collected, key=_SEVERITY.__getitem__)
