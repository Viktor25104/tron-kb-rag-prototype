from fastapi import APIRouter

from app.api.deps import ContainerDep
from app.api.schemas import RagQueryRequest, RagQueryResponse

router = APIRouter(prefix="/rag", tags=["rag"])


@router.post("/query", response_model=RagQueryResponse)
def run_query(request: RagQueryRequest, container: ContainerDep) -> RagQueryResponse:
    result = container.run_rag_query.execute(request.to_domain())
    return RagQueryResponse.model_validate(result)
