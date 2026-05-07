import React from 'react';
import { Badge } from '../ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export function TrustBadge({ type = 'verified', source, className }) {
  const isVerified = type === 'verified';
  const isAI = type === 'ai';

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`cursor-help gap-1 pl-1.5 pr-2 ${
              isVerified ? 'bg-success-tint text-success border-success/20' :
              isAI ? 'bg-brand-tint text-brand border-brand/20' :
              'bg-warning-tint text-warning border-warning/20'
            } ${className}`}
          >
            {isVerified && <CheckCircle2 className="w-3 h-3" />}
            {isAI && <span className="text-[10px]">✨</span>}
            {!isVerified && !isAI && <AlertCircle className="w-3 h-3" />}
            <span className="text-[10px] font-medium uppercase tracking-wider">
              {isVerified ? 'Verified' : isAI ? 'AI' : 'Unverified'}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-xs">
          {source || (
            isVerified ? "Verified against official records" :
            isAI ? "AI suggestion — verify before using" :
            "This information has not been verified"
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
