from dataclasses import dataclass

from app.application.ports import ArticleRepository, ProcessingRepository
from app.domain.enums import ProcessingStatus
from app.domain.models import Article, ProcessingJob

RECENT_PROCESSED_LIMIT = 3

_QUEUE_ORDER = {
    ProcessingStatus.FAILED: 0,
    ProcessingStatus.PROCESSING: 1,
    ProcessingStatus.QUEUED: 2,
    ProcessingStatus.PROCESSED: 3,
}


@dataclass(frozen=True, slots=True)
class QueueItem:
    job: ProcessingJob
    article: Article


class GetProcessingQueue:
    def __init__(self, articles: ArticleRepository, processing: ProcessingRepository) -> None:
        self._articles = articles
        self._processing = processing

    def execute(self, project_id: str) -> list[QueueItem]:
        articles = {article.id: article for article in self._articles.list(project_id)}
        jobs = [job for job in self._processing.list(project_id) if job.article_id in articles]

        active = [job for job in jobs if job.status is not ProcessingStatus.PROCESSED]
        recent = sorted(
            (job for job in jobs if job.status is ProcessingStatus.PROCESSED),
            key=lambda job: job.updated_at,
            reverse=True,
        )[:RECENT_PROCESSED_LIMIT]

        ordered = sorted(
            [*active, *recent],
            key=lambda job: (_QUEUE_ORDER[job.status], -job.updated_at.timestamp()),
        )
        return [QueueItem(job=job, article=articles[job.article_id]) for job in ordered]


class GetProcessingJob:
    def __init__(self, processing: ProcessingRepository) -> None:
        self._processing = processing

    def execute(self, article_id: str) -> ProcessingJob | None:
        return self._processing.get(article_id)
