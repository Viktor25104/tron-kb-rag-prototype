"""Export canned RAG runs and read-model snapshots for the static frontend build."""

import argparse
import json
from pathlib import Path
from typing import Any

from app.api.schemas import (
    ArticleDetailOut,
    ArticleListItemOut,
    FilterOptionsOut,
    ProcessingJobOut,
    QueueItemOut,
    RagQueryRequest,
    RagQueryResponse,
)
from app.application.config import DEFAULT_PROJECT_ID
from app.application.use_cases.articles import ArticleFilters
from app.infrastructure.container import Container, build_container
from app.infrastructure.fixtures import DEFAULT_FIXTURES_DIR, FixtureLoader

DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parents[2] / "frontend/public/fixtures"


def export_traces(container: Container, loader: FixtureLoader) -> list[dict[str, Any]]:
    exported: list[dict[str, Any]] = []
    for canned in loader.read_queries():
        request = RagQueryRequest.model_validate(
            {"text": canned["text"], "filters": canned["filters"]}
        )
        response = RagQueryResponse.model_validate(
            container.run_rag_query.execute(request.to_domain())
        )
        level = response.context.confidence.level.value
        if level != canned["expected_level"]:
            raise SystemExit(
                f"{canned['id']}: expected {canned['expected_level']}, pipeline produced {level}"
            )
        exported.append(
            {
                "id": canned["id"],
                "label": canned["label"],
                "request": request.model_dump(mode="json"),
                "response": response.model_dump(mode="json"),
            }
        )
    return exported


def export_snapshot(container: Container, project_id: str) -> dict[str, Any]:
    items = container.list_articles.execute(ArticleFilters(project_id))
    articles = [item.article for item in items]
    details: dict[str, Any] = {}
    jobs: dict[str, Any] = {}
    article_topics: dict[str, list[str]] = {}
    for article in articles:
        tree = container.get_article_tree.execute(article.id)
        if tree is not None:
            details[article.id] = ArticleDetailOut.model_validate(tree).model_dump(mode="json")
            article_topics[article.id] = [topic.id for topic in tree.topics]
        job = container.get_processing_job.execute(article.id)
        if job is not None:
            jobs[article.id] = ProcessingJobOut.model_validate(job).model_dump(mode="json")

    return {
        "articles": [ArticleListItemOut.from_item(item).model_dump(mode="json") for item in items],
        "article_topics": article_topics,
        "details": details,
        "jobs": jobs,
        "queue": [
            QueueItemOut.model_validate(item).model_dump(mode="json")
            for item in container.get_processing_queue.execute(project_id)
        ],
        "filters": FilterOptionsOut.model_validate(
            container.get_filter_options.execute(project_id)
        ).model_dump(mode="json"),
    }


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fixtures", type=Path, default=DEFAULT_FIXTURES_DIR)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    args = parser.parse_args()

    container = build_container(args.fixtures)
    traces = export_traces(container, FixtureLoader(args.fixtures))
    write_json(args.output_dir / "traces.json", {"queries": traces})
    write_json(args.output_dir / "api.json", export_snapshot(container, DEFAULT_PROJECT_ID))

    for item in traces:
        confidence = item["response"]["context"]["confidence"]
        outcome = "answer" if item["response"]["answer"] else "low_confidence"
        print(f"{item['id']:<18} {confidence['level']:<7} {confidence['score']:.3f}  {outcome}")
    print(f"written to {args.output_dir}")


if __name__ == "__main__":
    main()
