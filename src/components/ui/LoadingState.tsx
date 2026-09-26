import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Processing...',
  subMessage = 'Running compliance and commercial models...',
  className = '',
}) => {
  return (
    <div className={`rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 sm:p-12 text-center bg-white dark:bg-zinc-900/60 space-y-3 ${className}`}>
      <Loader2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
      <div className="space-y-1">
        <h4 className="font-extrabold text-zinc-950 dark:text-zinc-50 text-sm">{message}</h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed font-medium">
          {subMessage}
        </p>
      </div>
    </div>
  );
};
