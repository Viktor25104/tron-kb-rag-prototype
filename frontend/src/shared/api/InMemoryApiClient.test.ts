import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { similarity } from './cannedMatch';
import type { ApiSnapshotDto, RagFiltersDto, RagQueryRequestDto, TracesSnapshotDto } from './dto';
import { InMemoryApiClient, MEMORY_MODE_MESSAGE } from './InMemoryApiClient';

const load = (name: string): unknown =>
  JSON.parse(
    readFileSync(
      fileURLToPath(new URL(`../../../public/fixtures/${name}`, import.meta.url)),
      'utf8',
    ),
  );

const snapshot = load('api.json') as ApiSnapshotDto;
const traces = load('traces.json') as TracesSnapshotDto;
const client = new InMemoryApiClient(
  () => Promise.resolve(snapshot),
  () => Promise.resolve(traces),
);

const defaultFilters: RagFiltersDto = {
  project_id: 'tron-pool-energy',
  language: null,
  source_ids: [],
  topic_ids: [],
  entity_ids: [],
  article_ids: [],
  date_from: null,
  date_to: null,
  verification_statuses: [],
  exclude_outdated: true,
  min_confidence: null,
};

const request = (text: string, filters: Partial<RagFiltersDto> = {}): RagQueryRequestDto => ({
  text,
  filters: { ...defaultFilters, ...filters },
  top_k: 5,
});

describe('InMemoryApiClient.runRagQuery', () => {
  it('replays the canned run for a paraphrased query', async () => {
    const response = await client.runRagQuery(request('how to reduce USDT TRC20 fees'));

    expect(response.answer).not.toBeNull();
    expect(response.context.confidence.level).toBe('HIGH');
    expect(response.trace.query.original).toBe('How can I reduce USDT TRC-20 transaction fees?');
  });

  it('uses filters to tell apart canned runs with the same text', async () => {
    const response = await client.runRagQuery(
      request('How can I reduce USDT TRC-20 transaction fees?', { language: 'TR' }),
    );

    expect(response.answer).toBeNull();
    expect(response.trace.prefilter.corpus_after).toBe(0);
    expect(response.context.confidence.reasons).toContain(
      'corpus after filters: 0 processed chunks',
    );
  });

  it('returns the canned low-confidence run for the forecast question', async () => {
    const response = await client.runRagQuery(request('What will Energy rental cost in 2027?'));

    expect(response.low_confidence?.possible_sources.length).toBeGreaterThan(0);
  });

  it('answers unrelated input with an explicit low-confidence response', async () => {
    const response = await client.runRagQuery(request('best pizza in Kyiv'));

    expect(response.answer).toBeNull();
    expect(response.context.confidence.level).toBe('LOW');
    expect(response.low_confidence?.message).toBe(MEMORY_MODE_MESSAGE);
  });

  it('does not reuse a canned run when filters differ', async () => {
    const response = await client.runRagQuery(
      request('How can I reduce USDT TRC-20 transaction fees?', { source_ids: ['src-gsc'] }),
    );

    expect(response.low_confidence?.message).toBe(MEMORY_MODE_MESSAGE);
  });
});

describe('InMemoryApiClient read models', () => {
  it('filters articles like the backend does, including topic descendants', async () => {
    const failed = await client.listArticles({ status: 'FAILED' });
    const energy = await client.listArticles({ topic_id: 'top-energy' });

    expect(failed.map((a) => a.id)).toEqual(['art-delegation-guide']);
    expect(energy.map((a) => a.id)).toContain('art-rental-vs-burn');
  });

  it('rejects unknown articles with 404', async () => {
    await expect(client.getArticle('missing')).rejects.toMatchObject({ status: 404 });
  });
});

describe('similarity', () => {
  it('ignores case, punctuation, hyphens and plural forms', () => {
    expect(similarity('TRC-20 fees?', 'trc20 fee')).toBe(1);
  });
});
