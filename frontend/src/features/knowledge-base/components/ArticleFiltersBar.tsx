import type { ProcessingStatus } from '@/entities/article';
import type { FilterOptions } from '@/entities/filters';
import type { Language } from '@/entities/knowledge';
import { Select, humanize } from '@/shared/ui';
import type { ArticleListFilters } from '../api';

interface ArticleFiltersBarProps {
  value: ArticleListFilters;
  options: FilterOptions | undefined;
  onChange: (value: ArticleListFilters) => void;
}

export function ArticleFiltersBar({ value, options, onChange }: ArticleFiltersBarProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-2xl">
      <Select<string>
        label="Source"
        value={value.sourceId ?? ''}
        options={(options?.sources ?? []).map((s) => ({ value: s.id, label: s.name }))}
        onChange={(sourceId) => {
          onChange({ ...value, sourceId: sourceId || undefined });
        }}
      />
      <Select<Language>
        label="Language"
        value={value.language ?? ''}
        options={(options?.languages ?? []).map((l) => ({ value: l, label: l }))}
        onChange={(language) => {
          onChange({ ...value, language: language || undefined });
        }}
      />
      <Select<ProcessingStatus>
        label="Status"
        value={value.status ?? ''}
        options={(options?.statuses ?? []).map((s) => ({ value: s, label: humanize(s) }))}
        onChange={(status) => {
          onChange({ ...value, status: status || undefined });
        }}
      />
    </div>
  );
}
