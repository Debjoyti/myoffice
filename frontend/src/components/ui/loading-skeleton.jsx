import React from 'react';
import { Skeleton } from './skeleton';

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="dark-table-wrap w-full p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-8 w-[100px]" />
      </div>
      <div className="border rounded-md">
        <div className="flex border-b p-4 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`h-${i}`} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={`r-${i}`} className="flex border-b p-4 gap-4 items-center">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={`c-${i}-${j}`} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="border rounded-xl p-6 space-y-4 bg-card">
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="pt-4 flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}
