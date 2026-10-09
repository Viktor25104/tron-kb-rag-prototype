import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(create_app())


def test_health(client: TestClient) -> None:
    assert client.get("/api/v1/health").json() == {"status": "ok"}


def test_articles_filter_by_status(client: TestClient) -> None:
    response = client.get("/api/v1/articles", params={"status": "FAILED"})

    assert response.status_code == 200
    assert [a["id"] for a in response.json()] == ["art-delegation-guide"]


def test_article_tree_includes_knowledge(client: TestClient) -> None:
    body = client.get("/api/v1/articles/art-usdt-fees-en").json()

    assert body["article"]["sections"][0]["chunks"]
    assert body["facts"] and body["claims"] and body["entities"] and body["sources"]


def test_unknown_article_is_404(client: TestClient) -> None:
    assert client.get("/api/v1/articles/missing").status_code == 404


def test_rag_query_returns_answer_or_low_confidence(client: TestClient) -> None:
    body = client.post(
        "/api/v1/rag/query", json={"text": "How can I reduce USDT TRC-20 transaction fees?"}
    ).json()

    assert body["answer"] is not None
    assert body["low_confidence"] is None
    assert body["trace"]["prefilter"]["corpus_after"] > 0
    assert body["context"]["confidence"]["level"] == "HIGH"


def test_rag_query_validates_input(client: TestClient) -> None:
    assert client.post("/api/v1/rag/query", json={"text": ""}).status_code == 422
