from collections.abc import Sequence
from dataclasses import replace

from app.application.config import SCOPING_ENTITY_TYPES
from app.application.text import detect_language, extract_years, normalize, tokenize
from app.domain.enums import Language
from app.domain.models import Entity
from app.domain.rag import InferredFilter, MatchedEntity, RagFilters, UnderstoodQuery


class QueryUnderstanding:
    def __init__(self, entities: Sequence[Entity]) -> None:
        self._entities = {entity.id: entity for entity in entities}
        self._aliases: list[tuple[tuple[str, ...], Entity]] = []
        for entity in entities:
            for alias in {entity.name, *entity.aliases}:
                alias_tokens = tuple(tokenize(alias, drop_stopwords=False))
                if alias_tokens:
                    self._aliases.append((alias_tokens, entity))
        # Longest aliases first so "multi-signature" wins over a shorter overlapping alias.
        self._aliases.sort(key=lambda item: -len(item[0]))

    def understand(self, text: str) -> UnderstoodQuery:
        all_tokens = tokenize(text, drop_stopwords=False)
        entities = self._match_entities(all_tokens)
        language = detect_language(text)
        return UnderstoodQuery(
            original=text,
            normalized=normalize(text),
            tokens=tuple(tokenize(text)),
            language=language,
            entities=entities,
            years=tuple(extract_years(text)),
            expansions=self._expansions(entities, language),
        )

    def _expansions(self, entities: Sequence[MatchedEntity], language: Language) -> tuple[str, ...]:
        # Single-word aliases let full-text search match "multi-signature" for "multisig";
        # aliases in other languages would only add noise to a monolingual index.
        terms: list[str] = []
        for match in entities:
            entity = self._entities[match.entity_id]
            for alias in sorted({entity.name, *entity.aliases}):
                alias_tokens = tokenize(alias)
                if detect_language(alias) is not language:
                    continue
                if len(alias_tokens) == 1 and alias_tokens[0] not in terms:
                    terms.append(alias_tokens[0])
        return tuple(terms)

    def infer_filters(
        self, query: UnderstoodQuery, filters: RagFilters
    ) -> tuple[RagFilters, tuple[InferredFilter, ...]]:
        inferred: list[InferredFilter] = []
        effective = filters

        if filters.language is None:
            effective = replace(effective, language=query.language)
            inferred.append(
                InferredFilter("language", query.language.value, "detected from query text")
            )

        if not filters.entity_ids:
            scoping = [
                match
                for match in query.entities
                if self._entities[match.entity_id].type in SCOPING_ENTITY_TYPES
            ]
            if scoping:
                effective = replace(effective, entity_ids=tuple(m.entity_id for m in scoping))
                inferred.extend(
                    InferredFilter("entity_ids", m.entity_id, f"query mentions {m.name}")
                    for m in scoping
                )

        return effective, tuple(inferred)

    def _match_entities(self, tokens: Sequence[str]) -> tuple[MatchedEntity, ...]:
        matched: dict[str, MatchedEntity] = {}
        consumed: set[int] = set()
        for alias_tokens, entity in self._aliases:
            width = len(alias_tokens)
            for start in range(len(tokens) - width + 1):
                span = range(start, start + width)
                if (
                    consumed.intersection(span)
                    or tuple(tokens[start : start + width]) != alias_tokens
                ):
                    continue
                consumed.update(span)
                matched.setdefault(
                    entity.id, MatchedEntity(entity.id, entity.name, " ".join(alias_tokens))
                )
        return tuple(sorted(matched.values(), key=lambda m: m.name))
