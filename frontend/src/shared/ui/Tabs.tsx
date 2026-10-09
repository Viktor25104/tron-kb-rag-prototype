interface TabsProps<T extends string> {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
}

export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-x-1 border-b border-zinc-200 px-2" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === active}
          onClick={() => {
            onChange(tab.id);
          }}
          className={`-mb-px whitespace-nowrap border-b-2 px-2.5 py-2 text-sm ${
            tab.id === active
              ? 'border-zinc-900 font-medium text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-xs tabular-nums text-zinc-400">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
