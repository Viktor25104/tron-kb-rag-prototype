from dataclasses import dataclass
from datetime import date, datetime

from app.domain.enums import (
    ConfidenceLevel,
    Language,
    SearchOrigin,
    SuggestedActionType,
    VerificationStatus,
)
from app.domain.models import Chunk, Fact, Source


@dataclass(frozen=True, slots=True)
class RagFilters:
    project_id: str
    language: Language | None = None
    source_ids: tuple[str, ...] = ()
    topic_ids: tuple[str, ...] = ()
    entity_ids: tuple[str, ...] = ()
    article_ids: tuple[str, ...] = ()
    date_from: date | None = None
    date_to: date | None = None
    verification_statuses: tuple[VerificationStatus, ...] = ()
    exclude_outdated: bool = True
    min_confidence: float | None = None


@dataclass(frozen=True, slots=True)
class RagQuery:
    text: str
    filters: RagFilters
    top_k: int = 5


@dataclass(frozen=True, slots=True)
class MatchedEntity:
    entity_id: str
    name: str
    matched_text: str


@dataclass(frozen=True, slots=True)
class InferredFilter:
    field: str
    value: str
    reason: str


@dataclass(frozen=True, slots=True)
class UnderstoodQuery:
    original: str
    normalized: str
    tokens: tuple[str, ...]
    language: Language
    entities: tuple[MatchedEntity, ...]
    years: tuple[int, ...]
    expansions: tuple[str, ...] = ()

    @property
    def search_terms(self) -> tuple[str, ...]:
        return (*self.tokens, *(t for t in self.expansions if t not in self.tokens))

    @property
    def entity_ids(self) -> frozenset[str]:
        return frozenset(e.entity_id for e in self.entities)


@dataclass(frozen=True, slots=True)
class SearchCandidate:
    chunk_id: str
    score: float
    origin: SearchOrigin
    rank: int


@dataclass(frozen=True, slots=True)
class FusedCandidate:
    chunk_id: str
    score: float
    normalized_score: float
    ranks: dict[SearchOrigin, int]

    @property
    def origins(self) -> tuple[SearchOrigin, ...]:
        return tuple(sorted(self.ranks))


@dataclass(frozen=True, slots=True)
class RerankedCandidate:
    chunk_id: str
    score: float
    fused_score_norm: float
    entity_overlap: float
    source_reliability: float
    origins: tuple[SearchOrigin, ...]


@dataclass(frozen=True, slots=True)
class RerankOutcome:
    kept: tuple[RerankedCandidate, ...]
    dropped: tuple[RerankedCandidate, ...]


@dataclass(frozen=True, slots=True)
class ArticleRef:
    article_id: str
    title: str
    url: str
    section_id: str
    section_title: str
    language: Language
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class RankedResult:
    chunk: Chunk
    score: float
    verification_status: VerificationStatus
    source: Source
    article_ref: ArticleRef


@dataclass(frozen=True, slots=True)
class ConfidenceComponents:
    rerank_mean: float
    verified_share: float
    source_diversity: float


@dataclass(frozen=True, slots=True)
class Confidence:
    score: float
    level: ConfidenceLevel
    components: ConfidenceComponents
    reasons: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class RagContext:
    chunks: tuple[RankedResult, ...]
    facts: tuple[Fact, ...]
    sources: tuple[Source, ...]
    confidence: Confidence
    token_count: int
    excluded_total: int
    excluded_facts: tuple[Fact, ...] = ()


@dataclass(frozen=True, slots=True)
class Citation:
    marker: int
    chunk_id: str
    article_id: str
    source_id: str
    quote: str


@dataclass(frozen=True, slots=True)
class AgentAnswer:
    text: str
    citations: tuple[Citation, ...]
    model: str
    prompt_version: str
    tokens_in: int
    tokens_out: int
    cost_usd: float
    duration_ms: int


@dataclass(frozen=True, slots=True)
class PossibleSource:
    article_id: str
    title: str
    chunk_id: str
    score: float
    origins: tuple[SearchOrigin, ...]
    reason: str


@dataclass(frozen=True, slots=True)
class SuggestedAction:
    type: SuggestedActionType
    reason: str


@dataclass(frozen=True, slots=True)
class LowConfidenceResponse:
    message: str
    possible_sources: tuple[PossibleSource, ...]
    suggested_actions: tuple[SuggestedAction, ...]


@dataclass(frozen=True, slots=True)
class QueryUnderstandingTrace:
    original: str
    normalized: str
    tokens: tuple[str, ...]
    expansions: tuple[str, ...]
    detected_language: Language
    entities: tuple[MatchedEntity, ...]
    inferred_filters: tuple[InferredFilter, ...]
    years: tuple[int, ...]
    duration_ms: int


@dataclass(frozen=True, slots=True)
class FilterExclusion:
    filter: str
    excluded: int


@dataclass(frozen=True, slots=True)
class PrefilterTrace:
    corpus_before: int
    corpus_after: int
    exclusions: tuple[FilterExclusion, ...]
    duration_ms: int


@dataclass(frozen=True, slots=True)
class TraceCandidate:
    chunk_id: str
    article_id: str
    article_title: str
    score: float
    rank: int


@dataclass(frozen=True, slots=True)
class SearchTrace:
    origin: SearchOrigin
    top_n: int
    candidates: tuple[TraceCandidate, ...]
    duration_ms: int


@dataclass(frozen=True, slots=True)
class FusionTraceItem:
    chunk_id: str
    article_id: str
    article_title: str
    score: float
    normalized_score: float
    vector_rank: int | None
    fts_rank: int | None


@dataclass(frozen=True, slots=True)
class FusionTrace:
    k: int
    candidates: tuple[FusionTraceItem, ...]
    duration_ms: int


@dataclass(frozen=True, slots=True)
class RerankTraceItem:
    chunk_id: str
    article_id: str
    article_title: str
    score: float
    fused_score_norm: float
    entity_overlap: float
    source_reliability: float
    origins: tuple[SearchOrigin, ...]
    drop_reason: str | None


@dataclass(frozen=True, slots=True)
class RerankTrace:
    top_k: int
    min_score: float
    kept: tuple[RerankTraceItem, ...]
    dropped: tuple[RerankTraceItem, ...]
    duration_ms: int


@dataclass(frozen=True, slots=True)
class ContextTrace:
    chunks: int
    facts: int
    sources: int
    token_count: int
    excluded_facts: int
    duration_ms: int


@dataclass(frozen=True, slots=True)
class RagTrace:
    query: QueryUnderstandingTrace
    applied_filters: RagFilters
    prefilter: PrefilterTrace
    vector: SearchTrace
    fts: SearchTrace
    fusion: FusionTrace
    rerank: RerankTrace
    context: ContextTrace
    total_ms: int


@dataclass(frozen=True, slots=True)
class RagResult:
    trace: RagTrace
    results: tuple[RankedResult, ...]
    context: RagContext
    answer: AgentAnswer | None = None
    low_confidence: LowConfidenceResponse | None = None
