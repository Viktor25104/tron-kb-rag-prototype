import type { SuggestedActionType } from '@/entities/rag';

export type AnswerSegment = { kind: 'text'; text: string } | { kind: 'citation'; marker: number };

const MARKER_RE = /\[(\d+)\]/g;

export function splitAnswer(text: string): AnswerSegment[] {
  const segments: AnswerSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(MARKER_RE)) {
    if (match.index > cursor)
      segments.push({ kind: 'text', text: text.slice(cursor, match.index) });
    segments.push({ kind: 'citation', marker: Number(match[1]) });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) segments.push({ kind: 'text', text: text.slice(cursor) });
  return segments;
}

export const ACTION_LABELS: Record<SuggestedActionType, string> = {
  broaden_filters: 'Broaden filters',
  request_fact_verification: 'Request fact verification',
  create_content_gap_recommendation: 'Create content-gap recommendation',
};

export const ACTION_TOASTS: Record<SuggestedActionType, string> = {
  broaden_filters: 'Suggestion saved: rerun the query with fewer filters (mock)',
  request_fact_verification: 'Verification request queued for the editorial team (mock)',
  create_content_gap_recommendation: 'Content-gap recommendation created (mock)',
};
