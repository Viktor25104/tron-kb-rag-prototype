from fastapi import APIRouter

from app.api.deps import ContainerDep
from app.api.schemas import QueueItemOut
from app.application.config import DEFAULT_PROJECT_ID

router = APIRouter(prefix="/processing", tags=["processing"])


@router.get("/queue", response_model=list[QueueItemOut])
def get_queue(container: ContainerDep, project_id: str = DEFAULT_PROJECT_ID) -> list[QueueItemOut]:
    items = container.get_processing_queue.execute(project_id)
    return [QueueItemOut.model_validate(item) for item in items]
