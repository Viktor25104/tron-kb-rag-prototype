from enum import StrEnum


class ProcessingStatus(StrEnum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    PROCESSED = "PROCESSED"
    FAILED = "FAILED"


class ProcessingStage(StrEnum):
    PARSING = "PARSING"
    SECTIONING = "SECTIONING"
    CHUNKING = "CHUNKING"
    KNOWLEDGE_EXTRACTION = "KNOWLEDGE_EXTRACTION"
    EMBEDDING = "EMBEDDING"
    INDEXED = "INDEXED"


class StageState(StrEnum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class VerificationStatus(StrEnum):
    VERIFIED = "VERIFIED"
    UNVERIFIED = "UNVERIFIED"
    OUTDATED = "OUTDATED"
    CONFLICTING = "CONFLICTING"
    NO_SOURCE = "NO_SOURCE"


class SourceType(StrEnum):
    SITE = "SITE"
    TRON_DOCS = "TRON_DOCS"
    GSC = "GSC"
    GA4 = "GA4"
    AHREFS = "AHREFS"
    AI_VISIBILITY = "AI_VISIBILITY"
    EXTERNAL = "EXTERNAL"


class Language(StrEnum):
    EN = "EN"
    RU = "RU"
    UA = "UA"
    TR = "TR"
    ES = "ES"


class EntityType(StrEnum):
    NETWORK = "NETWORK"
    TOKEN = "TOKEN"
    TOKEN_STANDARD = "TOKEN_STANDARD"
    RESOURCE = "RESOURCE"
    MECHANISM = "MECHANISM"


class SearchOrigin(StrEnum):
    VECTOR = "vector"
    FTS = "fts"


class ConfidenceLevel(StrEnum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class PipelineStage(StrEnum):
    QUERY_UNDERSTANDING = "QUERY_UNDERSTANDING"
    PREFILTER = "PREFILTER"
    VECTOR_SEARCH = "VECTOR_SEARCH"
    FULL_TEXT_SEARCH = "FULL_TEXT_SEARCH"
    FUSION = "FUSION"
    RERANKING = "RERANKING"
    CONTEXT_BUILDING = "CONTEXT_BUILDING"


class SuggestedActionType(StrEnum):
    BROADEN_FILTERS = "broaden_filters"
    REQUEST_FACT_VERIFICATION = "request_fact_verification"
    CREATE_CONTENT_GAP_RECOMMENDATION = "create_content_gap_recommendation"
