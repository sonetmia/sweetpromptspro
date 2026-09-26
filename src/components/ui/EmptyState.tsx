import React from 'react';
import { LucideIcon, Layers } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Layers,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`rounded-xl border border-dashed border-zinc-800 p-8 sm:p-12 text-center bg-zinc-900/40 space-y-3.5 ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="font-semibold text-zinc-100 text-sm sm:text-base">
          {title}
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAction}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shadow-indigo-600/20"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};
