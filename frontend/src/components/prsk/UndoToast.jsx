import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { RotateCcw } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';

export function showUndoToast(message, onUndo) {
  sonnerToast.custom((t) => (
    <div className="flex items-center justify-between gap-4 p-3 bg-surface border border-border shadow-level2 rounded-lg w-full max-w-sm">
      <span className="text-sm text-text font-medium">{message}</span>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs bg-surface-2 hover:bg-surface-3 border-border-strong gap-1.5"
        onClick={() => {
          onUndo();
          sonnerToast.dismiss(t);
        }}
      >
        <RotateCcw className="w-3 h-3" />
        Undo
      </Button>
    </div>
  ), {
    duration: 5000,
  });
}
// Note: This is a utility function wrapping Sonner, not a React component to render directly.
// To use: import { showUndoToast } from './UndoToast'; showUndoToast("Invoice deleted", () => restoreInvoice());
