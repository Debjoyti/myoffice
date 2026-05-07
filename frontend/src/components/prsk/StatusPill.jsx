import React from 'react';
import { Badge } from '../ui/badge';
import { Circle, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export function StatusPill({ status, className }) {
  const normalizedStatus = status?.toLowerCase() || 'unknown';

  const config = {
    // Success states
    paid: { color: 'text-success bg-success-tint border-success/20', icon: CheckCircle2 },
    completed: { color: 'text-success bg-success-tint border-success/20', icon: CheckCircle2 },
    approved: { color: 'text-success bg-success-tint border-success/20', icon: CheckCircle2 },
    active: { color: 'text-success bg-success-tint border-success/20', icon: Circle },

    // Warning states
    pending: { color: 'text-warning bg-warning-tint border-warning/20', icon: Clock },
    draft: { color: 'text-warning bg-warning-tint border-warning/20', icon: Circle },
    'in progress': { color: 'text-warning bg-warning-tint border-warning/20', icon: Clock },

    // Danger states
    overdue: { color: 'text-danger bg-danger-tint border-danger/20', icon: AlertCircle },
    failed: { color: 'text-danger bg-danger-tint border-danger/20', icon: XCircle },
    cancelled: { color: 'text-text-muted bg-surface-2 border-border', icon: XCircle },
    rejected: { color: 'text-danger bg-danger-tint border-danger/20', icon: XCircle },

    // Default
    unknown: { color: 'text-text-muted bg-surface-2 border-border', icon: Circle }
  };

  const { color, icon: Icon } = config[normalizedStatus] || config.unknown;

  return (
    <Badge variant="outline" className={cn(`gap-1.5 font-medium capitalize pl-1.5 pr-2.5 ${color}`, className)}>
      <Icon className={cn("w-3.5 h-3.5", normalizedStatus === 'active' || normalizedStatus === 'draft' ? "fill-current" : "")} />
      {status}
    </Badge>
  );
}
