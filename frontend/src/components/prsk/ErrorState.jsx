import React from 'react';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this information. Please try again.",
  onRetry,
  className
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center rounded-lg bg-danger-tint/30 border border-danger/20 min-h-[250px]", className)}>
      <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center mb-4 text-danger">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-text mb-1">{title}</h3>
      <p className="text-sm text-text-muted max-w-[300px] mb-5">
        {description}
      </p>

      <div className="flex items-center gap-4">
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
            <RefreshCcw className="w-3.5 h-3.5" />
            Try again
          </Button>
        )}
        <a href="#" className="text-xs text-text-subtle hover:text-text underline underline-offset-2">
          Report this issue
        </a>
      </div>
    </div>
  );
}
