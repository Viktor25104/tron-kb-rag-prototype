import pytest

from app.infrastructure.fixtures import FixtureData, FixtureLoader


@pytest.fixture(scope="session")
def fixture_data() -> FixtureData:
    return FixtureLoader().load()
