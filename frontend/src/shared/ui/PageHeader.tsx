import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
        {description && <div className="mt-0.5 text-sm text-zinc-500">{description}</div>}
      </div>
      {actions}
    </div>
  );
}
