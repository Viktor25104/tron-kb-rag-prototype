import type { ArticleListItem } from '@/entities/article';
import type { VerificationStatus } from '@/entities/knowledge';

export interface KbSummary {
  articles: number;
  chunks: number;
  embedded: number;
  embeddedShare: number;
  facts: Record<VerificationStatus, number>;
  factsTotal: number;
}

const EMPTY_FACTS: Record<VerificationStatus, number> = {
  VERIFIED: 0,
  UNVERIFIED: 0,
  OUTDATED: 0,
  CONFLICTING: 0,
  NO_SOURCE: 0,
};

export function summarize(articles: ArticleListItem[]): KbSummary {
  const facts = { ...EMPTY_FACTS };
  let chunks = 0;
  let embedded = 0;
  for (const article of articles) {
    chunks += article.chunkCount;
    embedded += article.embeddedCount;
    for (const status of Object.keys(facts) as VerificationStatus[]) {
      facts[status] += article.factCounts[status];
    }
  }
  return {
    articles: articles.length,
    chunks,
    embedded,
    embeddedShare: chunks === 0 ? 0 : embedded / chunks,
    facts,
    factsTotal: Object.values(facts).reduce((sum, value) => sum + value, 0),
  };
}

export function isEmbeddingIncomplete(article: ArticleListItem): boolean {
  return article.status === 'FAILED' || article.embeddedCount < article.chunkCount;
}
