import { NavLink, Outlet } from 'react-router-dom';
import { DEFAULT_PROJECT_ID } from '@/entities/rag';
import { useApiClient } from '@/shared/api';
import { Badge } from '@/shared/ui';

const NAV = [
  { to: '/kb', label: 'Knowledge Base' },
  { to: '/processing', label: 'Processing' },
  { to: '/rag', label: 'RAG Search' },
  { to: '/architecture', label: 'Architecture' },
];

export function Layout() {
  const { mode } = useApiClient();
  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
        <div className="border-b border-zinc-200 px-4 py-3.5">
          <div className="text-sm font-semibold">TRON Pool Energy</div>
          <div className="text-xs text-zinc-500">Knowledge platform</div>
        </div>
        <nav className="flex flex-col gap-0.5 p-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm ${isActive ? 'bg-zinc-100 font-medium text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-4 py-2.5 md:px-6">
          <label className="flex items-center gap-2 text-sm text-zinc-500">
            Project
            <select
              className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900"
              value={DEFAULT_PROJECT_ID}
              onChange={() => undefined}
            >
              <option value={DEFAULT_PROJECT_ID}>{DEFAULT_PROJECT_ID}</option>
            </select>
          </label>
          <nav className="order-last flex w-full gap-4 overflow-x-auto whitespace-nowrap text-sm md:hidden">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className="text-zinc-600">
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto">
            <Badge
              tone={mode === 'memory' ? 'violet' : 'blue'}
              title={
                mode === 'memory'
                  ? 'Static build: data and RAG runs are pre-computed by the backend export script'
                  : 'Live: requests go to the FastAPI backend'
              }
            >
              mode: {mode}
            </Badge>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
