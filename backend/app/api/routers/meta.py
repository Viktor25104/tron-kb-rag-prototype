from fastapi import APIRouter

from app.api.deps import ContainerDep
from app.api.schemas import FilterOptionsOut, HealthOut
from app.application.config import DEFAULT_PROJECT_ID

router = APIRouter(tags=["meta"])


@router.get("/meta/filters", response_model=FilterOptionsOut)
def get_filters(container: ContainerDep, project_id: str = DEFAULT_PROJECT_ID) -> FilterOptionsOut:
    return FilterOptionsOut.model_validate(container.get_filter_options.execute(project_id))


@router.get("/health", response_model=HealthOut)
def health() -> HealthOut:
    return HealthOut(status="ok")
