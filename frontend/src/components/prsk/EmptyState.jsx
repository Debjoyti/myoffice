import React from 'react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-lg bg-surface/50 min-h-[300px]", className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mb-4 text-text-muted">
          <Icon className="w-6 h-6" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-sm font-semibold text-text mb-1">{title}</h3>
      <p className="text-sm text-text-muted max-w-[280px] mb-6">
        {description}
      </p>

      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              variant="default"
              size="sm"
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              size="sm"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
