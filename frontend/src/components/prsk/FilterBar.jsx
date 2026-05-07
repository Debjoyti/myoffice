import React from 'react';
import { Search, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export function FilterBar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  activeFilters = [],
  onRemoveFilter,
  onClearAll,
  className
}) {
  return (
    <div className={cn("flex flex-col gap-3 mb-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            Sort by
            <ChevronDown className="w-4 h-4 text-text-muted" />
          </Button>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-muted mr-1">Active filters:</span>
          {activeFilters.map((filter, idx) => (
            <Badge key={idx} variant="secondary" className="gap-1 px-2 py-0.5 bg-surface-2 hover:bg-surface-2 border-border font-normal text-xs">
              <span className="text-text-muted">{filter.label}:</span>
              <span className="font-medium">{filter.value}</span>
              <button
                onClick={() => onRemoveFilter?.(filter)}
                className="ml-1 text-text-muted hover:text-text focus:outline-none"
              >
                <X className="w-3 h-3" />
                <span className="sr-only">Remove filter</span>
              </button>
            </Badge>
          ))}
          {activeFilters.length > 1 && (
            <button
              onClick={onClearAll}
              className="text-xs text-brand hover:text-brand-tint transition-colors ml-2"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
