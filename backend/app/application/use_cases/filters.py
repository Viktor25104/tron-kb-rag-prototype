from dataclasses import dataclass
from datetime import date

from app.application.ports import ArticleRepository, KnowledgeRepository
from app.domain.enums import Language, ProcessingStatus, VerificationStatus
from app.domain.models import Entity, Source, Topic


@dataclass(frozen=True, slots=True)
class ArticleOption:
    id: str
    title: str
    language: Language


@dataclass(frozen=True, slots=True)
class FilterOptions:
    project_ids: tuple[str, ...]
    languages: tuple[Language, ...]
    statuses: tuple[ProcessingStatus, ...]
    verification_statuses: tuple[VerificationStatus, ...]
    sources: tuple[Source, ...]
    topics: tuple[Topic, ...]
    entities: tuple[Entity, ...]
    articles: tuple[ArticleOption, ...]
    date_min: date | None
    date_max: date | None


class GetFilterOptions:
    def __init__(self, articles: ArticleRepository, knowledge: KnowledgeRepository) -> None:
        self._articles = articles
        self._knowledge = knowledge

    def execute(self, project_id: str) -> FilterOptions:
        articles = self._articles.list(project_id)
        dates = [article.updated_at.date() for article in articles]
        return FilterOptions(
            project_ids=(project_id,),
            languages=tuple(Language),
            statuses=tuple(ProcessingStatus),
            verification_statuses=tuple(VerificationStatus),
            sources=tuple(self._knowledge.sources(project_id)),
            topics=tuple(self._knowledge.topics(project_id)),
            entities=tuple(self._knowledge.entities(project_id)),
            articles=tuple(ArticleOption(a.id, a.title, a.language) for a in articles),
            date_min=min(dates, default=None),
            date_max=max(dates, default=None),
        )
