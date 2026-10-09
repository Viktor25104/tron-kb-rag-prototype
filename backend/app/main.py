import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import articles, meta, processing, rag
from app.infrastructure.container import build_container
from app.infrastructure.fixtures import DEFAULT_FIXTURES_DIR

API_PREFIX = "/api/v1"


def create_app() -> FastAPI:
    app = FastAPI(title="TRON KB / RAG prototype", version="0.1.0")
    fixtures_dir = Path(os.environ.get("FIXTURES_DIR", DEFAULT_FIXTURES_DIR))
    app.state.container = build_container(fixtures_dir)

    origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    for router in (articles.router, processing.router, meta.router, rag.router):
        app.include_router(router, prefix=API_PREFIX)
    return app


app = create_app()
