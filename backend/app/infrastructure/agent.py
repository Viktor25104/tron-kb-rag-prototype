import re

from app.domain.enums import ConfidenceLevel, VerificationStatus
from app.domain.models import Fact
from app.domain.rag import AgentAnswer, Citation, RagContext, RankedResult, UnderstoodQuery

MODEL_NAME = "gpt-4.1-mini (mock)"
PROMPT_VERSION = "answer_v1"
MAX_CITATIONS = 3
PRICE_PER_1K_INPUT_USD = 0.0004
PRICE_PER_1K_OUTPUT_USD = 0.0016
BASE_LATENCY_MS = 380
LATENCY_PER_OUTPUT_TOKEN_MS = 14
MIN_STANDALONE_SENTENCE = 40

SYSTEM_PROMPT = (
    "You answer questions about TRON resources for the TRON POOL ENERGY knowledge base. "
    "Use only the facts and excerpts provided. Cite every statement with its marker. "
    "If the context does not answer the question, say so."
)

_SENTENCE_END = re.compile(r"(?<=[.!?])\s+")


class TemplateAgent:
    def answer(self, query: UnderstoodQuery, context: RagContext) -> AgentAnswer:
        cited = context.chunks[:MAX_CITATIONS]
        citations: list[Citation] = []
        sentences: list[str] = []
        for marker, result in enumerate(cited, start=1):
            statement = self._statement_for(result, context.facts)
            sentences.append(f"{statement} [{marker}]")
            citations.append(
                Citation(
                    marker=marker,
                    chunk_id=result.chunk.id,
                    article_id=result.article_ref.article_id,
                    source_id=result.source.id,
                    quote=_first_sentence(result.chunk.text),
                )
            )

        text = " ".join(sentences)
        if context.confidence.level is ConfidenceLevel.MEDIUM:
            caveats = "; ".join(context.confidence.reasons)
            text += f"\n\nConfidence is medium ({caveats}). Verify before publishing."

        tokens_in = len(_render_prompt(query, context)) // 4
        tokens_out = len(text) // 4
        cost = (
            tokens_in / 1000 * PRICE_PER_1K_INPUT_USD + tokens_out / 1000 * PRICE_PER_1K_OUTPUT_USD
        )
        return AgentAnswer(
            text=text,
            citations=tuple(citations),
            model=MODEL_NAME,
            prompt_version=PROMPT_VERSION,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            cost_usd=round(cost, 6),
            duration_ms=BASE_LATENCY_MS + LATENCY_PER_OUTPUT_TOKEN_MS * tokens_out,
        )

    @staticmethod
    def _statement_for(result: RankedResult, facts: tuple[Fact, ...]) -> str:
        linked = [f for f in facts if f.chunk_id == result.chunk.id]
        verified = [f for f in linked if f.status is VerificationStatus.VERIFIED]
        if verified:
            return verified[0].statement.rstrip(".") + "."
        return _first_sentence(result.chunk.text)


def _first_sentence(text: str) -> str:
    sentences = _SENTENCE_END.split(text.strip())
    # A short lead-in like "Batching payouts also helps." says nothing on its own.
    if len(sentences) > 1 and len(sentences[0]) < MIN_STANDALONE_SENTENCE:
        return f"{sentences[0]} {sentences[1]}"
    return sentences[0]


def _render_prompt(query: UnderstoodQuery, context: RagContext) -> str:
    excerpts = "\n\n".join(
        f"[{i}] ({r.source.name}) {r.chunk.text}" for i, r in enumerate(context.chunks, start=1)
    )
    facts = "\n".join(f"- {f.statement} ({f.status.value})" for f in context.facts)
    return (
        f"{SYSTEM_PROMPT}\n\nQuestion: {query.original}\n\nExcerpts:\n{excerpts}\n\nFacts:\n{facts}"
    )
