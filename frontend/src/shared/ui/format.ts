const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
const numberFormat = new Intl.NumberFormat('en-US');

export const formatDate = (value: Date | null): string => (value ? dateFormat.format(value) : '—');

export const formatDateTime = (value: Date): string => dateTimeFormat.format(value);

export const formatNumber = (value: number): string => numberFormat.format(value);

export const formatScore = (value: number): string => value.toFixed(2);

export const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;

export const formatMs = (value: number | null): string => {
  if (value === null) return '—';
  return value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${value} ms`;
};

export const formatUsd = (value: number): string => `$${value.toFixed(5)}`;

export const humanize = (value: string): string =>
  value.charAt(0) + value.slice(1).toLowerCase().replaceAll('_', ' ');
