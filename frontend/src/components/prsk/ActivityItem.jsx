import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';

export function ActivityItem({ actor, action, target, timestamp, context, avatarUrl }) {
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';
  };

  return (
    <div className="flex gap-3 py-3 group">
      <Avatar className="w-8 h-8 border border-border">
        <AvatarImage src={avatarUrl} alt={actor} />
        <AvatarFallback className="text-xs bg-surface-2 text-text-muted">{getInitials(actor)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text leading-snug">
          <span className="font-medium">{actor}</span>{' '}
          <span className="text-text-muted">{action}</span>{' '}
          <span className="font-medium">{target}</span>
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-text-subtle">
          <span>{timeAgo}</span>
          {context && (
            <>
              <span className="w-1 h-1 rounded-full bg-border-strong"></span>
              <span className="truncate">{context}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
