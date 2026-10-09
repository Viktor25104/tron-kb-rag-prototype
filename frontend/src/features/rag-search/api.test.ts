import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { blockingReason, emptyFilters, type RagRequest } from '@/entities/rag';
import type { TracesSnapshotDto } from '@/shared/api/dto';
import { mapRagResponse, toRequestDto } from './api';
import { decodeRequest, encodeRequest } from './model';

const traces = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('../../../public/fixtures/traces.json', import.meta.url)),
    'utf8',
  ),
) as TracesSnapshotDto;

const canned = (id: string) => {
  const item = traces.queries.find((q) => q.id === id);
  if (!item) throw new Error(`missing canned query ${id}`);
  return item;
};

describe('mapRagResponse', () => {
  it('maps an answered run into camelCase entities', () => {
    const dto = canned('fees-reduce').response;
    const result = mapRagResponse(dto);

    expect(result.outcome.kind).toBe('answer');
    expect(result.context.confidence.blockedBy).toEqual([]);
    expect(blockingReason(result.context.confidence)).toBeNull();
    expect(result.trace.prefilter.corpusAfter).toBe(dto.trace.prefilter.corpus_after);
    expect(result.trace.fusion.candidates[0]?.normalizedScore).toBe(
      dto.trace.fusion.candidates[0]?.normalized_score,
    );
    expect(result.context.confidence.components.rerankMean).toBe(
      dto.context.confidence.components.rerank_mean,
    );
    expect(result.results[0]?.chunk.createdAt).toBeInstanceOf(Date);
    expect(result.results[0]?.articleRef.sectionTitle).toBe(
      dto.results[0]?.article_ref.section_title,
    );
  });

  it('maps a refused run into the low-confidence outcome', () => {
    const result = mapRagResponse(canned('rental-forecast').response);

    expect(result.outcome.kind).toBe('low_confidence');
    expect(result.context.confidence.blockedBy).toEqual(['no evidence dated 2027 or later']);
    expect(blockingReason(result.context.confidence)).toBe('no evidence dated 2027 or later');
    if (result.outcome.kind !== 'low_confidence') return;
    expect(result.outcome.lowConfidence.possibleSources[0]?.reason).toMatch(
      /dropped by reranker: score \d\.\d{2}/,
    );
  });
});

describe('blockingReason', () => {
  it('stays silent when the score alone is already low', () => {
    const empty = mapRagResponse(canned('fees-reduce-tr').response).context.confidence;

    expect(empty.blockedBy).toEqual(['corpus after filters: 0 processed chunks']);
    expect(blockingReason(empty)).toBeNull();
  });
});

describe('request mapping', () => {
  const request: RagRequest = {
    text: 'How does multisig affect transaction fees?',
    filters: { ...emptyFilters(), language: 'EN', entityIds: ['ent-multisig'], minConfidence: 0.7 },
    topK: 5,
  };

  it('converts filters to snake_case DTO', () => {
    expect(toRequestDto(request).filters).toMatchObject({
      language: 'EN',
      entity_ids: ['ent-multisig'],
      min_confidence: 0.7,
      exclude_outdated: true,
    });
  });

  it('round-trips through the URL with only non-default filters encoded', () => {
    const params = encodeRequest(request);

    expect(JSON.parse(params.get('f') ?? '{}')).toEqual({
      language: 'EN',
      entityIds: ['ent-multisig'],
      minConfidence: 0.7,
    });
    expect(decodeRequest(params)).toEqual(request);
  });

  it('treats a missing query as no request', () => {
    expect(decodeRequest(new URLSearchParams('f={}'))).toBeNull();
  });
});
