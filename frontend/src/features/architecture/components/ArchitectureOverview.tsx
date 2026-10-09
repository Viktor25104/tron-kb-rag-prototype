import { Panel } from '@/shared/ui';
import { DECISIONS, OPEN_QUESTIONS, RESPONSIBILITIES } from '../model';
import { ArchitectureDiagram } from './ArchitectureDiagram';

export function ArchitectureOverview() {
  return (
    <div className="flex flex-col gap-4">
      <Panel title="Flow">
        <div className="overflow-x-auto">
          <ArchitectureDiagram />
        </div>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <ResponsibilityList
          title="Knowledge Base stores and structures"
          items={RESPONSIBILITIES.knowledgeBase}
        />
        <ResponsibilityList
          title="RAG searches and assembles context"
          items={RESPONSIBILITIES.rag}
        />
      </div>
      <Panel title="Key decisions">
        <dl className="grid gap-4 md:grid-cols-2">
          {DECISIONS.map((decision) => (
            <div key={decision.title}>
              <dt className="text-sm font-semibold text-zinc-900">{decision.title}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-zinc-600">{decision.body}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      <Panel title="Open questions">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-zinc-700">
          {OPEN_QUESTIONS.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-zinc-500">
          Full write-up: docs/architecture.md in the repository.
        </p>
      </Panel>
    </div>
  );
}

function ResponsibilityList({ title, items }: { title: string; items: string[] }) {
  return (
    <Panel title={title}>
      <ul className="space-y-1.5 text-sm text-zinc-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-zinc-400" aria-hidden>
              –
            </span>
            {item}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
