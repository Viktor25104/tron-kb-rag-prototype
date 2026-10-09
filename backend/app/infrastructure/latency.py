from app.domain.enums import PipelineStage

# (fixed cost, cost per unit of work) in milliseconds. Shaped after typical numbers for a
# pgvector HNSW lookup, a tsvector query and a cross-encoder reranker on CPU, and kept
# deterministic so exported traces do not churn between runs.
_PROFILE: dict[PipelineStage, tuple[float, float]] = {
    PipelineStage.QUERY_UNDERSTANDING: (3.0, 0.5),
    PipelineStage.PREFILTER: (2.0, 0.08),
    PipelineStage.VECTOR_SEARCH: (14.0, 0.35),
    PipelineStage.FULL_TEXT_SEARCH: (6.0, 0.2),
    PipelineStage.FUSION: (1.0, 0.02),
    PipelineStage.RERANKING: (38.0, 6.5),
    PipelineStage.CONTEXT_BUILDING: (4.0, 0.6),
}


class SyntheticLatency:
    def stage_ms(self, stage: PipelineStage, units: int) -> int:
        fixed, per_unit = _PROFILE[stage]
        return round(fixed + per_unit * units)
