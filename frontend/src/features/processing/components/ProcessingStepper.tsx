import type { ProcessingJob } from '@/entities/processing';
import { Stepper } from '@/shared/ui';
import { toSteps } from '../model';

export function ProcessingStepper({ job }: { job: ProcessingJob }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <Stepper steps={toSteps(job)} />
      </div>
    </div>
  );
}
