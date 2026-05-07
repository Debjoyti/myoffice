import React from 'react';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function BulkActionBar({ selectedCount, actions = [], onClear, className }) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
            "flex items-center gap-4 p-2 pl-4 bg-surface border border-border shadow-level2 rounded-lg",
            className
          )}
        >
          <div className="flex items-center gap-2 border-r border-border pr-4">
            <span className="flex items-center justify-center bg-brand text-brand-fg text-xs font-bold w-5 h-5 rounded">
              {selectedCount}
            </span>
            <span className="text-sm font-medium text-text">selected</span>
          </div>

          <div className="flex items-center gap-2">
            {actions.map((action, idx) => (
              <Button
                key={idx}
                size="sm"
                variant={action.variant || "secondary"}
                onClick={action.onClick}
                className="h-8 text-xs"
              >
                {action.icon && <action.icon className="w-3.5 h-3.5 mr-1.5" />}
                {action.label}
              </Button>
            ))}
          </div>

          <div className="pl-2">
            <Button variant="ghost" size="icon" onClick={onClear} className="h-8 w-8 text-text-muted hover:text-text">
              <X className="w-4 h-4" />
              <span className="sr-only">Clear selection</span>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
