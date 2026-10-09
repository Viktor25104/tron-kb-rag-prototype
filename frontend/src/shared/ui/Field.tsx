import type { ReactNode } from 'react';

interface SelectProps<T extends string> {
  label: string;
  value: T | '';
  options: { value: T; label: string }[];
  onChange: (value: T | '') => void;
  placeholder?: string;
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Any',
}: SelectProps<T>) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(event) => {
          onChange(event.target.value as T | '');
        }}
        className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

interface MultiSelectProps {
  label: string;
  values: string[];
  options: { value: string; label: string }[];
  onChange: (values: string[]) => void;
}

export function MultiSelect({ label, values, options, onChange }: MultiSelectProps) {
  return (
    <Field label={label}>
      <select
        multiple
        value={values}
        onChange={(event) => {
          onChange(Array.from(event.target.selectedOptions, (option) => option.value));
        }}
        className="h-20 w-full rounded border border-zinc-300 bg-white px-1 py-1 text-sm text-zinc-900"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="px-1">
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-zinc-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
        className="h-4 w-4 rounded border-zinc-300"
      />
      {label}
    </label>
  );
}

export function Button({
  children,
  onClick,
  variant = 'secondary',
  type = 'button',
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const styles = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-700 disabled:bg-zinc-400',
    secondary:
      'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 disabled:text-zinc-400',
    danger: 'border border-rose-300 bg-white text-rose-700 hover:bg-rose-50',
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium ${styles}`}
    >
      {children}
    </button>
  );
}
