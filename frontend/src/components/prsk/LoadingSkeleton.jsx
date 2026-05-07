import React from 'react';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';

export function TableSkeleton({ rows = 5, cols = 4, className }) {
  return (
    <div className={cn("w-full border border-border rounded-lg overflow-hidden", className)}>
      <div className="flex bg-surface-2 border-b border-border p-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={`th-${i}`} className="flex-1 px-2">
            <Skeleton className="h-4 w-20 bg-border" />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rIndex) => (
        <div key={`tr-${rIndex}`} className="flex p-3 border-b border-border last:border-0 bg-surface">
          {Array.from({ length: cols }).map((_, cIndex) => (
            <div key={`td-${rIndex}-${cIndex}`} className="flex-1 px-2 flex items-center">
              {cIndex === 0 ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ) : (
                <Skeleton className={`h-4 ${cIndex === cols - 1 ? 'w-12' : 'w-full max-w-[120px]'}`} />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 4, className }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 border border-border rounded-lg bg-surface">
          <div className="flex justify-between items-start mb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ className }) {
  return (
    <div className={cn("space-y-6 max-w-2xl", className)}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}
