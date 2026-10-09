import { blockingReason, type Confidence } from '@/entities/rag';
import { Badge, StatusPill } from '@/shared/ui';

export function ConfidenceLevel({ confidence }: { confidence: Confidence }) {
  const blocked = blockingReason(confidence);
  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusPill status={confidence.level} />
      {blocked && (
        <Badge tone="red" title="The score is high enough, but a blocking condition forces LOW">
          blocked
        </Badge>
      )}
    </span>
  );
}

export function BlockedNote({ confidence }: { confidence: Confidence }) {
  const blocked = blockingReason(confidence);
  if (!blocked) return null;
  return <p className="mt-1 text-sm font-medium text-rose-700">Blocked: {blocked}</p>;
}
