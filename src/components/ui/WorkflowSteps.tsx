import React from 'react';
import { Check } from 'lucide-react';

export type StepState = 'create' | 'check' | 'export';

interface WorkflowStepsProps {
  currentStep: StepState;
  onStepClick?: (step: StepState) => void;
  className?: string;
}

export const WorkflowSteps: React.FC<WorkflowStepsProps> = ({
  currentStep,
  onStepClick,
  className = '',
}) => {
  const steps: { id: StepState; label: string; num: string }[] = [
    { id: 'create', label: 'Create', num: '01' },
    { id: 'check', label: 'Check', num: '02' },
    { id: 'export', label: 'Export', num: '03' },
  ];

  const getStatus = (stepId: StepState) => {
    if (currentStep === 'create') {
      if (stepId === 'create') return 'active';
      return 'pending';
    }
    if (currentStep === 'check') {
      if (stepId === 'create') return 'completed';
      if (stepId === 'check') return 'active';
      return 'pending';
    }
    // currentStep === 'export'
    if (stepId === 'export') return 'active';
    return 'completed';
  };

  return (
    <div className={`flex items-center gap-2 sm:gap-4 py-2 ${className}`}>
      {steps.map((step, idx) => {
        const status = getStatus(step.id);
        return (
          <React.Fragment key={step.id}>
            {idx > 0 && (
              <div className="w-4 sm:w-8 h-[1px] bg-zinc-200 dark:bg-zinc-800 shrink-0" />
            )}
            <button
              type="button"
              onClick={() => onStepClick && onStepClick(step.id)}
              disabled={!onStepClick}
              className={`flex items-center gap-2 text-xs transition-colors ${
                onStepClick ? 'cursor-pointer' : 'cursor-default'
              } ${
                status === 'active'
                  ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                  : status === 'completed'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-zinc-500 font-medium'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 transition-colors ${
                  status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                    : status === 'active'
                    ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/60 ring-2 ring-indigo-500/20 font-bold'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {status === 'completed' ? (
                  <Check className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  <span>{step.num}</span>
                )}
              </span>
              <span className="hidden xs:inline tracking-wide">{step.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};
