from collections.abc import Mapping, Sequence

from app.application.config import (
    MIN_RESULTS_FOR_ANSWER,
    RERANK_MIN_SCORE,
    RRF_K,
    SEARCH_TOP_N,
)
from app.application.context_builder import ContextBuilder
from app.application.low_confidence import build_low_confidence
from app.application.ports import (
    AgentPort,
    ArticleRepository,
    FullTextSearchPort,
    KnowledgeRepository,
    LatencyModel,
    RerankerPort,
    VectorSearchPort,
)
from app.application.prefilter import CorpusChunk, prefilter
from app.application.query_understanding import QueryUnderstanding
from app.application.ranking import rrf
from app.domain.enums import ConfidenceLevel, PipelineStage, SearchOrigin
from app.domain.rag import (
    ArticleRef,
    ContextTrace,
    FusedCandidate,
    FusionTrace,
    FusionTraceItem,
    PrefilterTrace,
    QueryUnderstandingTrace,
    RagContext,
    RagFilters,
    RagQuery,
    RagResult,
    RagTrace,
    RankedResult,
    RerankedCandidate,
    RerankOutcome,
    RerankTrace,
    RerankTraceItem,
    SearchCandidate,
    SearchTrace,
    TraceCandidate,
)
from app.domain.verification import aggregate_status


class RunRagQuery:
    def __init__(
        self,
        articles: ArticleRepository,
        knowledge: KnowledgeRepository,
        vector_search: VectorSearchPort,
        full_text_search: FullTextSearchPort,
        reranker: RerankerPort,
        agent: AgentPort,
        latency: LatencyModel,
    ) -> None:
        self._articles = articles
        self._knowledge = knowledge
        self._vector_search = vector_search
        self._full_text_search = full_text_search
        self._reranker = reranker
        self._agent = agent
        self._latency = latency
        self._context_builder = ContextBuilder(knowledge)

    def execute(self, query: RagQuery) -> RagResult:
        project_id = query.filters.project_id
        understanding = QueryUnderstanding(self._knowledge.entities(project_id))
        understood = understanding.understand(query.text)
        filters, inferred = understanding.infer_filters(understood, query.filters)

        corpus = self._load_corpus(project_id)
        by_chunk = {item.chunk.id: item for item in corpus}
        filtered = prefilter(corpus, filters, self._knowledge.topics(project_id))
        searchable = [item.chunk for item in filtered.kept]

        vector_hits = self._vector_search.search(understood, searchable, SEARCH_TOP_N)
        fts_hits = self._full_text_search.search(understood, searchable, SEARCH_TOP_N)
        fused = rrf([vector_hits, fts_hits], k=RRF_K)
        outcome = _apply_score_floor(self._reranker.rerank(understood, fused, query.top_k))

        ranked = tuple(self._to_ranked(c, by_chunk[c.chunk_id]) for c in outcome.kept)
        context = self._context_builder.build(
            ranked,
            filters,
            understood,
            corpus_before=filtered.corpus_before,
            corpus_after=len(filtered.kept),
        )

        answer = None
        low_confidence = None
        if _should_refuse(context, filters):
            low_confidence = build_low_confidence(
                context,
                outcome.dropped,
                {chunk_id: item.article for chunk_id, item in by_chunk.items()},
                filters_applied=bool(inferred)
                or query.filters != RagFilters(project_id=project_id),
            )
        else:
            answer = self._agent.answer(understood, context)

        timings = {
            PipelineStage.QUERY_UNDERSTANDING: self._ms(
                PipelineStage.QUERY_UNDERSTANDING, len(understood.tokens)
            ),
            PipelineStage.PREFILTER: self._ms(PipelineStage.PREFILTER, len(corpus)),
            PipelineStage.VECTOR_SEARCH: self._ms(PipelineStage.VECTOR_SEARCH, len(searchable)),
            PipelineStage.FULL_TEXT_SEARCH: self._ms(
                PipelineStage.FULL_TEXT_SEARCH, len(searchable)
            ),
            PipelineStage.FUSION: self._ms(PipelineStage.FUSION, len(fused)),
            PipelineStage.RERANKING: self._ms(PipelineStage.RERANKING, len(fused)),
            PipelineStage.CONTEXT_BUILDING: self._ms(
                PipelineStage.CONTEXT_BUILDING, len(context.facts) + len(ranked)
            ),
        }
        trace = RagTrace(
            query=QueryUnderstandingTrace(
                original=understood.original,
                normalized=understood.normalized,
                tokens=understood.tokens,
                expansions=understood.expansions,
                detected_language=understood.language,
                entities=understood.entities,
                inferred_filters=inferred,
                years=understood.years,
                duration_ms=timings[PipelineStage.QUERY_UNDERSTANDING],
            ),
            applied_filters=filters,
            prefilter=PrefilterTrace(
                corpus_before=filtered.corpus_before,
                corpus_after=len(filtered.kept),
                exclusions=filtered.exclusions,
                duration_ms=timings[PipelineStage.PREFILTER],
            ),
            vector=_search_trace(
                SearchOrigin.VECTOR, vector_hits, by_chunk, timings[PipelineStage.VECTOR_SEARCH]
            ),
            fts=_search_trace(
                SearchOrigin.FTS, fts_hits, by_chunk, timings[PipelineStage.FULL_TEXT_SEARCH]
            ),
            fusion=_fusion_trace(fused, by_chunk, timings[PipelineStage.FUSION]),
            rerank=_rerank_trace(query.top_k, outcome, by_chunk, timings[PipelineStage.RERANKING]),
            context=ContextTrace(
                chunks=len(context.chunks),
                facts=len(context.facts),
                sources=len(context.sources),
                token_count=context.token_count,
                excluded_facts=len(context.excluded_facts),
                duration_ms=timings[PipelineStage.CONTEXT_BUILDING],
            ),
            total_ms=sum(timings.values()),
        )
        return RagResult(
            trace=trace,
            results=ranked,
            context=context,
            answer=answer,
            low_confidence=low_confidence,
        )

    def _load_corpus(self, project_id: str) -> list[CorpusChunk]:
        corpus: list[CorpusChunk] = []
        for article in self._articles.list(project_id):
            chunks = article.chunks
            facts = self._knowledge.facts_for_chunks([c.id for c in chunks])
            topic_ids = self._knowledge.topic_ids_for_article(article.id)
            for chunk in chunks:
                corpus.append(
                    CorpusChunk(
                        chunk=chunk,
                        article=article,
                        entity_ids=self._knowledge.entity_ids_for_chunk(chunk.id),
                        topic_ids=topic_ids,
                        verification=aggregate_status(
                            f.status for f in facts if f.chunk_id == chunk.id
                        ),
                    )
                )
        return corpus

    def _to_ranked(self, candidate: RerankedCandidate, item: CorpusChunk) -> RankedResult:
        article = item.article
        source = self._knowledge.source(article.source_id)
        section = article.section(item.chunk.section_id)
        if source is None or section is None:
            raise LookupError(f"Inconsistent knowledge base for chunk {item.chunk.id}")
        return RankedResult(
            chunk=item.chunk,
            score=candidate.score,
            verification_status=item.verification,
            source=source,
            article_ref=ArticleRef(
                article_id=article.id,
                title=article.title,
                url=article.url,
                section_id=section.id,
                section_title=section.title,
                language=article.language,
                updated_at=article.updated_at,
            ),
        )

    def _ms(self, stage: PipelineStage, units: int) -> int:
        return self._latency.stage_ms(stage, units)


def _apply_score_floor(outcome: RerankOutcome) -> RerankOutcome:
    kept = tuple(c for c in outcome.kept if c.score >= RERANK_MIN_SCORE)
    below_floor = tuple(c for c in outcome.kept if c.score < RERANK_MIN_SCORE)
    dropped = sorted([*below_floor, *outcome.dropped], key=lambda c: (-c.score, c.chunk_id))
    return RerankOutcome(kept=kept, dropped=tuple(dropped))


def _should_refuse(context: RagContext, filters: RagFilters) -> bool:
    confidence = context.confidence
    if confidence.level is ConfidenceLevel.LOW or len(context.chunks) < MIN_RESULTS_FOR_ANSWER:
        return True
    return filters.min_confidence is not None and confidence.score < filters.min_confidence


def _search_trace(
    origin: SearchOrigin,
    hits: Sequence[SearchCandidate],
    by_chunk: Mapping[str, CorpusChunk],
    duration_ms: int,
) -> SearchTrace:
    return SearchTrace(
        origin=origin,
        top_n=SEARCH_TOP_N,
        candidates=tuple(
            TraceCandidate(
                chunk_id=hit.chunk_id,
                article_id=by_chunk[hit.chunk_id].article.id,
                article_title=by_chunk[hit.chunk_id].article.title,
                score=round(hit.score, 4),
                rank=hit.rank,
            )
            for hit in hits
        ),
        duration_ms=duration_ms,
    )


def _fusion_trace(
    fused: Sequence[FusedCandidate], by_chunk: Mapping[str, CorpusChunk], duration_ms: int
) -> FusionTrace:
    return FusionTrace(
        k=RRF_K,
        candidates=tuple(
            FusionTraceItem(
                chunk_id=c.chunk_id,
                article_id=by_chunk[c.chunk_id].article.id,
                article_title=by_chunk[c.chunk_id].article.title,
                score=round(c.score, 5),
                normalized_score=round(c.normalized_score, 4),
                vector_rank=c.ranks.get(SearchOrigin.VECTOR),
                fts_rank=c.ranks.get(SearchOrigin.FTS),
            )
            for c in fused
        ),
        duration_ms=duration_ms,
    )


def _rerank_trace(
    top_k: int, outcome: RerankOutcome, by_chunk: Mapping[str, CorpusChunk], duration_ms: int
) -> RerankTrace:
    def item(c: RerankedCandidate, drop_reason: str | None) -> RerankTraceItem:
        article = by_chunk[c.chunk_id].article
        return RerankTraceItem(
            chunk_id=c.chunk_id,
            article_id=article.id,
            article_title=article.title,
            score=round(c.score, 4),
            fused_score_norm=round(c.fused_score_norm, 4),
            entity_overlap=round(c.entity_overlap, 4),
            source_reliability=c.source_reliability,
            origins=c.origins,
            drop_reason=drop_reason,
        )

    return RerankTrace(
        top_k=top_k,
        min_score=RERANK_MIN_SCORE,
        kept=tuple(item(c, None) for c in outcome.kept),
        dropped=tuple(
            item(c, "below min score" if c.score < RERANK_MIN_SCORE else "outside top-k")
            for c in outcome.dropped
        ),
        duration_ms=duration_ms,
    )
