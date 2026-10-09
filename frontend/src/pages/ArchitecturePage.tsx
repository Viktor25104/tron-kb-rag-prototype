import { ArchitectureOverview } from '@/features/architecture';
import { PageHeader } from '@/shared/ui';

export function ArchitecturePage() {
  return (
    <>
      <PageHeader
        title="Architecture"
        description="Knowledge Base stores and structures, RAG searches and assembles context, the agent answers."
      />
      <ArchitectureOverview />
    </>
  );
}
