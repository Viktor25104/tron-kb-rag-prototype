from fastapi import APIRouter, HTTPException

from app.api.deps import ContainerDep
from app.api.schemas import ArticleDetailOut, ArticleListItemOut, ProcessingJobOut
from app.application.config import DEFAULT_PROJECT_ID
from app.application.use_cases.articles import ArticleFilters
from app.domain.enums import Language, ProcessingStatus

router = APIRouter(prefix="/articles", tags=["knowledge-base"])


@router.get("", response_model=list[ArticleListItemOut])
def list_articles(
    container: ContainerDep,
    project_id: str = DEFAULT_PROJECT_ID,
    language: Language | None = None,
    source_id: str | None = None,
    status: ProcessingStatus | None = None,
    topic_id: str | None = None,
) -> list[ArticleListItemOut]:
    items = container.list_articles.execute(
        ArticleFilters(project_id, language, source_id, status, topic_id)
    )
    return [ArticleListItemOut.from_item(item) for item in items]


@router.get("/{article_id}", response_model=ArticleDetailOut)
def get_article(article_id: str, container: ContainerDep) -> ArticleDetailOut:
    tree = container.get_article_tree.execute(article_id)
    if tree is None:
        raise HTTPException(status_code=404, detail=f"Article {article_id} not found")
    return ArticleDetailOut.model_validate(tree)


@router.get("/{article_id}/processing", response_model=ProcessingJobOut)
def get_article_processing(article_id: str, container: ContainerDep) -> ProcessingJobOut:
    job = container.get_processing_job.execute(article_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"No processing job for {article_id}")
    return ProcessingJobOut.model_validate(job)
