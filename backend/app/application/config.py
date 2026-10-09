from app.domain.enums import EntityType

DEFAULT_PROJECT_ID = "tron-pool-energy"

SEARCH_TOP_N = 20
RRF_K = 60
DEFAULT_TOP_K = 5

# Below this the reranker treats a candidate as noise even if it made the top-k.
RERANK_MIN_SCORE = 0.7

MIN_RESULTS_FOR_ANSWER = 3

CONFIDENCE_WEIGHT_RERANK = 0.5
CONFIDENCE_WEIGHT_VERIFIED = 0.3
CONFIDENCE_WEIGHT_DIVERSITY = 0.2
SOURCE_DIVERSITY_TARGET = 3
HIGH_CONFIDENCE_THRESHOLD = 0.75
MEDIUM_CONFIDENCE_THRESHOLD = 0.6

# Generic resources like Energy appear in almost every chunk; scoping on them would
# only shrink recall, so only narrow concepts turn into inferred entity filters.
SCOPING_ENTITY_TYPES = frozenset({EntityType.TOKEN_STANDARD, EntityType.MECHANISM})

MAX_POSSIBLE_SOURCES = 5
