import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from pydantic import TypeAdapter

from app.domain.models import Article, Claim, Entity, Fact, ProcessingJob, Source, Topic

DEFAULT_FIXTURES_DIR = Path(__file__).resolve().parents[3] / "fixtures"

JsonObject = dict[str, Any]


@dataclass(frozen=True, slots=True)
class FixtureData:
    articles: list[Article]
    sources: list[Source]
    entities: list[Entity]
    topics: list[Topic]
    facts: list[Fact]
    claims: list[Claim]
    chunk_entities: dict[str, tuple[str, ...]]
    article_topics: dict[str, tuple[str, ...]]
    jobs: list[ProcessingJob]


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


class FixtureLoader:
    def __init__(self, fixtures_dir: Path = DEFAULT_FIXTURES_DIR) -> None:
        self._dir = fixtures_dir

    def load(self) -> FixtureData:
        articles_doc = self._read("articles.json")
        knowledge_doc = self._read("knowledge.json")
        processing_doc = self._read("processing.json")

        articles = TypeAdapter(list[Article]).validate_python(
            [_expand_article(a, articles_doc) for a in articles_doc["articles"]]
        )
        project_id = knowledge_doc["project_id"]
        return FixtureData(
            articles=articles,
            sources=TypeAdapter(list[Source]).validate_python(
                _with_project(knowledge_doc["sources"], project_id)
            ),
            entities=TypeAdapter(list[Entity]).validate_python(
                _with_project(knowledge_doc["entities"], project_id)
            ),
            topics=TypeAdapter(list[Topic]).validate_python(
                _with_project(knowledge_doc["topics"], project_id)
            ),
            facts=TypeAdapter(list[Fact]).validate_python(
                _with_project(knowledge_doc["facts"], project_id)
            ),
            claims=TypeAdapter(list[Claim]).validate_python(
                _with_project(knowledge_doc["claims"], project_id)
            ),
            chunk_entities={k: tuple(v) for k, v in knowledge_doc["chunk_entities"].items()},
            article_topics={k: tuple(v) for k, v in knowledge_doc["article_topics"].items()},
            jobs=TypeAdapter(list[ProcessingJob]).validate_python(
                _with_project(processing_doc["jobs"], processing_doc["project_id"])
            ),
        )

    def read_queries(self) -> list[JsonObject]:
        queries: list[JsonObject] = self._read("queries.json")["queries"]
        return queries

    def _read(self, name: str) -> JsonObject:
        with (self._dir / name).open(encoding="utf-8") as handle:
            document: JsonObject = json.load(handle)
        return document


def _with_project(items: list[JsonObject], project_id: str) -> list[JsonObject]:
    return [{"project_id": project_id, **item} for item in items]


def _expand_article(raw: JsonObject, document: JsonObject) -> JsonObject:
    # Fixtures are written the way an editor sees an article; ids of parents, project and
    # processing metadata are filled in here so the JSON stays readable.
    project_id = document["project_id"]
    default_model = document["embedding_model"]
    sections = []
    for order, section in enumerate(raw.get("sections", []), start=1):
        chunks = [
            {
                "project_id": project_id,
                "article_id": raw["id"],
                "section_id": section["id"],
                "created_at": raw["updated_at"],
                "token_count": estimate_tokens(chunk["text"]),
                "embedded": chunk.get("embedded", True),
                "embedding_model": default_model if chunk.get("embedded", True) else None,
                **{k: v for k, v in chunk.items() if k != "embedded"},
            }
            for chunk in section.get("chunks", [])
        ]
        sections.append(
            {
                "project_id": project_id,
                "article_id": raw["id"],
                "order": order,
                **section,
                "chunks": chunks,
            }
        )
    return {**raw, "project_id": project_id, "sections": sections}
