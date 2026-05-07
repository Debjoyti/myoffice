import React from 'react';
import { FileQuestion, AlertCircle } from 'lucide-react';

export function EmptyState({ title, description, icon: Icon = FileQuestion, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px] border border-dashed rounded-xl bg-card/50">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, retry }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px] border border-destructive/20 rounded-xl bg-destructive/5">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight mb-1 text-destructive">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {retry && (
        <button onClick={retry} className="btn-dark-cancel text-destructive hover:bg-destructive/10 border-destructive/20">
          Try Again
        </button>
      )}
    </div>
  );
}
