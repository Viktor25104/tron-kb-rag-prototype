from dataclasses import dataclass
from pathlib import Path

from app.application.use_cases.articles import GetArticleTree, ListArticles
from app.application.use_cases.filters import GetFilterOptions
from app.application.use_cases.processing import GetProcessingJob, GetProcessingQueue
from app.application.use_cases.rag import RunRagQuery
from app.infrastructure.agent import TemplateAgent
from app.infrastructure.fixtures import DEFAULT_FIXTURES_DIR, FixtureLoader
from app.infrastructure.latency import SyntheticLatency
from app.infrastructure.repositories import (
    InMemoryArticleRepository,
    InMemoryKnowledgeRepository,
    InMemoryProcessingRepository,
)
from app.infrastructure.reranker import MockReranker
from app.infrastructure.search import Bm25FullTextSearch, MockVectorSearch


@dataclass(frozen=True, slots=True)
class Container:
    list_articles: ListArticles
    get_article_tree: GetArticleTree
    get_processing_queue: GetProcessingQueue
    get_processing_job: GetProcessingJob
    get_filter_options: GetFilterOptions
    run_rag_query: RunRagQuery


def build_container(fixtures_dir: Path = DEFAULT_FIXTURES_DIR) -> Container:
    data = FixtureLoader(fixtures_dir).load()
    articles = InMemoryArticleRepository(data)
    knowledge = InMemoryKnowledgeRepository(data)
    processing = InMemoryProcessingRepository(data)
    chunk_sources = {chunk.id: a.source_id for a in data.articles for chunk in a.chunks}

    return Container(
        list_articles=ListArticles(articles, knowledge),
        get_article_tree=GetArticleTree(articles, knowledge),
        get_processing_queue=GetProcessingQueue(articles, processing),
        get_processing_job=GetProcessingJob(processing),
        get_filter_options=GetFilterOptions(articles, knowledge),
        run_rag_query=RunRagQuery(
            articles=articles,
            knowledge=knowledge,
            vector_search=MockVectorSearch(),
            full_text_search=Bm25FullTextSearch(),
            reranker=MockReranker(knowledge, chunk_sources),
            agent=TemplateAgent(),
            latency=SyntheticLatency(),
        ),
    )
