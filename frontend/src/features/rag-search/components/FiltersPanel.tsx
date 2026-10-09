import type { FilterOptions } from '@/entities/filters';
import { topicPath } from '@/entities/filters';
import type { Language, VerificationStatus } from '@/entities/knowledge';
import { emptyFilters, type RagFilters } from '@/entities/rag';
import { Button, Checkbox, Field, MultiSelect, Select, humanize } from '@/shared/ui';

interface FiltersPanelProps {
  value: RagFilters;
  options: FilterOptions | undefined;
  onChange: (value: RagFilters) => void;
}

export function FiltersPanel({ value, options, onChange }: FiltersPanelProps) {
  const set = <K extends keyof RagFilters>(key: K, next: RagFilters[K]) => {
    onChange({ ...value, [key]: next });
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Select<string>
        label="Project"
        value={value.projectId}
        placeholder="—"
        options={(options?.projectIds ?? [value.projectId]).map((id) => ({ value: id, label: id }))}
        onChange={(projectId) => {
          set('projectId', projectId || value.projectId);
        }}
      />
      <Select<Language>
        label="Language"
        value={value.language ?? ''}
        placeholder="Detect from query"
        options={(options?.languages ?? []).map((l) => ({ value: l, label: l }))}
        onChange={(language) => {
          set('language', language || null);
        }}
      />
      <MultiSelect
        label="Source"
        values={value.sourceIds}
        options={(options?.sources ?? []).map((s) => ({ value: s.id, label: s.name }))}
        onChange={(ids) => {
          set('sourceIds', ids);
        }}
      />
      <MultiSelect
        label="Topic"
        values={value.topicIds}
        options={(options?.topics ?? []).map((t) => ({
          value: t.id,
          label: topicPath(t.id, options?.topics ?? []),
        }))}
        onChange={(ids) => {
          set('topicIds', ids);
        }}
      />
      <MultiSelect
        label="Entity"
        values={value.entityIds}
        options={(options?.entities ?? []).map((e) => ({ value: e.id, label: e.name }))}
        onChange={(ids) => {
          set('entityIds', ids);
        }}
      />
      <MultiSelect
        label="Document"
        values={value.articleIds}
        options={(options?.articles ?? []).map((a) => ({
          value: a.id,
          label: `${a.title} (${a.language})`,
        }))}
        onChange={(ids) => {
          set('articleIds', ids);
        }}
      />
      <MultiSelect
        label="Verification status"
        values={value.verificationStatuses}
        options={(options?.verificationStatuses ?? []).map((s) => ({
          value: s,
          label: humanize(s),
        }))}
        onChange={(ids) => {
          set('verificationStatuses', ids as VerificationStatus[]);
        }}
      />
      <div className="flex flex-col gap-3">
        <Field label="Date range">
          <div className="flex gap-1.5">
            <input
              type="date"
              value={value.dateFrom ?? ''}
              min={options?.dateMin ?? undefined}
              onChange={(e) => {
                set('dateFrom', e.target.value || null);
              }}
              className="min-w-0 flex-1 rounded border border-zinc-300 px-1.5 py-1 text-sm"
              aria-label="Date from"
            />
            <input
              type="date"
              value={value.dateTo ?? ''}
              max={options?.dateMax ?? undefined}
              onChange={(e) => {
                set('dateTo', e.target.value || null);
              }}
              className="min-w-0 flex-1 rounded border border-zinc-300 px-1.5 py-1 text-sm"
              aria-label="Date to"
            />
          </div>
        </Field>
        <Field label="Min confidence to answer">
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            placeholder="Policy default"
            value={value.minConfidence ?? ''}
            onChange={(e) => {
              set('minConfidence', e.target.value === '' ? null : Number(e.target.value));
            }}
            className="rounded border border-zinc-300 px-2 py-1 text-sm"
          />
        </Field>
        <div className="flex items-center justify-between gap-2">
          <Checkbox
            label="Exclude outdated"
            checked={value.excludeOutdated}
            onChange={(checked) => {
              set('excludeOutdated', checked);
            }}
          />
          <Button
            onClick={() => {
              onChange(emptyFilters(value.projectId));
            }}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
