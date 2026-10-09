from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.application.config import DEFAULT_PROJECT_ID, DEFAULT_TOP_K
from app.application.use_cases.articles import ArticleListItem
from app.domain.enums import (
    ConfidenceLevel,
    EntityType,
    Language,
    ProcessingStage,
    ProcessingStatus,
    SearchOrigin,
    SourceType,
    StageState,
    SuggestedActionType,
    VerificationStatus,
)
from app.domain.rag import RagFilters, RagQuery


class Schema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class SourceOut(Schema):
    id: str
    name: str
    type: SourceType
    url: str
    reliability: float


class EntityOut(Schema):
    id: str
    name: str
    type: EntityType
    aliases: list[str]


class TopicOut(Schema):
    id: str
    name: str
    parent_id: str | None


class ChunkOut(Schema):
    id: str
    section_id: str
    article_id: str
    text: str
    token_count: int
    embedding_model: str | None
    embedded: bool
    created_at: datetime
    semantic_tags: list[str]


class SectionOut(Schema):
    id: str
    title: str
    order: int
    chunks: list[ChunkOut]


class ArticleVersionOut(Schema):
    version: str
    released_at: date
    change_reason: str
    is_live: bool


class ArticleSummaryOut(Schema):
    id: str
    project_id: str
    title: str
    url: str
    source_id: str
    language: Language
    version: str
    status: ProcessingStatus
    updated_at: datetime
    chunk_count: int
    embedded_count: int


class ArticleListItemOut(ArticleSummaryOut):
    fact_counts: dict[VerificationStatus, int]

    @classmethod
    def from_item(cls, item: ArticleListItem) -> "ArticleListItemOut":
        summary = ArticleSummaryOut.model_validate(item.article)
        return cls(**summary.model_dump(), fact_counts=item.fact_counts)


class ArticleOut(ArticleSummaryOut):
    sections: list[SectionOut]
    versions: list[ArticleVersionOut]


class FactOut(Schema):
    id: str
    chunk_id: str
    statement: str
    status: VerificationStatus
    source_id: str | None
    verified_at: datetime | None


class ClaimOut(Schema):
    id: str
    chunk_id: str
    statement: str
    status: VerificationStatus
    source_id: str | None


class ArticleDetailOut(Schema):
    article: ArticleOut
    facts: list[FactOut]
    claims: list[ClaimOut]
    entities: list[EntityOut]
    topics: list[TopicOut]
    sources: list[SourceOut]
    chunk_entities: dict[str, list[str]]


class StageResultOut(Schema):
    stage: ProcessingStage
    state: StageState
    duration_ms: int | None
    counters: dict[str, int]


class StageErrorOut(Schema):
    stage: ProcessingStage
    message: str
    retries: int
    occurred_at: datetime
    log: list[str]


class ProcessingJobOut(Schema):
    article_id: str
    status: ProcessingStatus
    current_stage: ProcessingStage | None
    stages: list[StageResultOut]
    error: StageErrorOut | None
    updated_at: datetime


class QueueItemOut(Schema):
    job: ProcessingJobOut
    article: ArticleSummaryOut


class ArticleOptionOut(Schema):
    id: str
    title: str
    language: Language


class FilterOptionsOut(Schema):
    project_ids: list[str]
    languages: list[Language]
    statuses: list[ProcessingStatus]
    verification_statuses: list[VerificationStatus]
    sources: list[SourceOut]
    topics: list[TopicOut]
    entities: list[EntityOut]
    articles: list[ArticleOptionOut]
    date_min: date | None
    date_max: date | None


class RagFiltersSchema(Schema):
    project_id: str = DEFAULT_PROJECT_ID
    language: Language | None = None
    source_ids: list[str] = Field(default_factory=list)
    topic_ids: list[str] = Field(default_factory=list)
    entity_ids: list[str] = Field(default_factory=list)
    article_ids: list[str] = Field(default_factory=list)
    date_from: date | None = None
    date_to: date | None = None
    verification_statuses: list[VerificationStatus] = Field(default_factory=list)
    exclude_outdated: bool = True
    min_confidence: float | None = Field(default=None, ge=0, le=1)


class RagQueryRequest(Schema):
    text: str = Field(min_length=1, max_length=500)
    filters: RagFiltersSchema = Field(default_factory=RagFiltersSchema)
    top_k: int = Field(default=DEFAULT_TOP_K, ge=1, le=20)

    def to_domain(self) -> RagQuery:
        f = self.filters
        return RagQuery(
            text=self.text,
            top_k=self.top_k,
            filters=RagFilters(
                project_id=f.project_id,
                language=f.language,
                source_ids=tuple(f.source_ids),
                topic_ids=tuple(f.topic_ids),
                entity_ids=tuple(f.entity_ids),
                article_ids=tuple(f.article_ids),
                date_from=f.date_from,
                date_to=f.date_to,
                verification_statuses=tuple(f.verification_statuses),
                exclude_outdated=f.exclude_outdated,
                min_confidence=f.min_confidence,
            ),
        )


class MatchedEntityOut(Schema):
    entity_id: str
    name: str
    matched_text: str


class InferredFilterOut(Schema):
    field: str
    value: str
    reason: str


class QueryUnderstandingTraceOut(Schema):
    original: str
    normalized: str
    tokens: list[str]
    expansions: list[str]
    detected_language: Language
    entities: list[MatchedEntityOut]
    inferred_filters: list[InferredFilterOut]
    years: list[int]
    duration_ms: int


class FilterExclusionOut(Schema):
    filter: str
    excluded: int


class PrefilterTraceOut(Schema):
    corpus_before: int
    corpus_after: int
    exclusions: list[FilterExclusionOut]
    duration_ms: int


class TraceCandidateOut(Schema):
    chunk_id: str
    article_id: str
    article_title: str
    score: float
    rank: int


class SearchTraceOut(Schema):
    origin: SearchOrigin
    top_n: int
    candidates: list[TraceCandidateOut]
    duration_ms: int


class FusionTraceItemOut(Schema):
    chunk_id: str
    article_id: str
    article_title: str
    score: float
    normalized_score: float
    vector_rank: int | None
    fts_rank: int | None


class FusionTraceOut(Schema):
    k: int
    candidates: list[FusionTraceItemOut]
    duration_ms: int


class RerankTraceItemOut(Schema):
    chunk_id: str
    article_id: str
    article_title: str
    score: float
    fused_score_norm: float
    entity_overlap: float
    source_reliability: float
    origins: list[SearchOrigin]
    drop_reason: str | None


class RerankTraceOut(Schema):
    top_k: int
    min_score: float
    kept: list[RerankTraceItemOut]
    dropped: list[RerankTraceItemOut]
    duration_ms: int


class ContextTraceOut(Schema):
    chunks: int
    facts: int
    sources: int
    token_count: int
    excluded_facts: int
    duration_ms: int


class RagTraceOut(Schema):
    query: QueryUnderstandingTraceOut
    applied_filters: RagFiltersSchema
    prefilter: PrefilterTraceOut
    vector: SearchTraceOut
    fts: SearchTraceOut
    fusion: FusionTraceOut
    rerank: RerankTraceOut
    context: ContextTraceOut
    total_ms: int


class ArticleRefOut(Schema):
    article_id: str
    title: str
    url: str
    section_id: str
    section_title: str
    language: Language
    updated_at: datetime


class RankedResultOut(Schema):
    chunk: ChunkOut
    score: float
    verification_status: VerificationStatus
    source: SourceOut
    article_ref: ArticleRefOut


class ConfidenceComponentsOut(Schema):
    rerank_mean: float
    verified_share: float
    source_diversity: float


class ConfidenceOut(Schema):
    score: float
    level: ConfidenceLevel
    components: ConfidenceComponentsOut
    reasons: list[str]


class RagContextOut(Schema):
    chunks: list[RankedResultOut]
    facts: list[FactOut]
    sources: list[SourceOut]
    confidence: ConfidenceOut
    token_count: int
    excluded_total: int
    excluded_facts: list[FactOut]


class CitationOut(Schema):
    marker: int
    chunk_id: str
    article_id: str
    source_id: str
    quote: str


class AgentAnswerOut(Schema):
    text: str
    citations: list[CitationOut]
    model: str
    prompt_version: str
    tokens_in: int
    tokens_out: int
    cost_usd: float
    duration_ms: int


class PossibleSourceOut(Schema):
    article_id: str
    title: str
    chunk_id: str
    score: float
    origins: list[SearchOrigin]
    reason: str


class SuggestedActionOut(Schema):
    type: SuggestedActionType
    reason: str


class LowConfidenceOut(Schema):
    message: str
    possible_sources: list[PossibleSourceOut]
    suggested_actions: list[SuggestedActionOut]


class RagQueryResponse(Schema):
    trace: RagTraceOut
    results: list[RankedResultOut]
    context: RagContextOut
    answer: AgentAnswerOut | None
    low_confidence: LowConfidenceOut | None


class HealthOut(Schema):
    status: str
