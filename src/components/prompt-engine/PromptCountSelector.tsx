import React from 'react';
import { PromptCount, PROMPT_COUNT_OPTIONS } from '../../lib/prompt-engine/promptSchema';
import { Layers } from 'lucide-react';

interface PromptCountSelectorProps {
  value: PromptCount;
  onChange: (count: PromptCount) => void;
  disabled?: boolean;
}

export const PromptCountSelector: React.FC<PromptCountSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[#E8E4DC] flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#8C8A86]" />
          <span>Batch Quantity</span>
        </label>
        <span className="text-[11px] font-mono text-[#8C8A86]">
          Target: <strong className="text-[#C74A43] font-semibold">{value}</strong> {value === 1 ? 'Prompt' : 'Prompts'}
        </span>
      </div>

      {/* Segmented Control */}
      <div className="grid grid-cols-6 gap-1 p-1 rounded-[6px] bg-[#090B0D] border border-[#272D30]">
        {PROMPT_COUNT_OPTIONS.map((count) => {
          const isSelected = value === count;
          return (
            <button
              key={count}
              type="button"
              disabled={disabled}
              onClick={() => onChange(count)}
              className={`py-1.5 px-1 text-center rounded-[4px] text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                isSelected
                  ? 'bg-[#C74A43] text-[#F3EDE2] font-semibold'
                  : 'text-[#8C8A86] hover:text-[#F3EDE2] hover:bg-[#171E24]'
              }`}
            >
              <span>{count}</span>
              <span className="text-[10px] block font-normal opacity-70 sm:inline sm:ml-1">
                {count === 1 ? 'Prm' : 'Prms'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
