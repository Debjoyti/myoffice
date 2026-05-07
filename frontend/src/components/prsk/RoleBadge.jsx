import React from 'react';
import { Badge } from '../ui/badge';
import { Shield, Users, DollarSign, UserCog, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export function RoleBadge({ role, className }) {
  const normalizedRole = role?.toLowerCase() || 'employee';

  const config = {
    admin: { color: 'text-brand bg-brand-tint border-brand/20', icon: Shield },
    superadmin: { color: 'text-[#8b5cf6] bg-[#8b5cf6]/10 border-[#8b5cf6]/20', icon: Shield },
    hr: { color: 'text-[#ec4899] bg-[#ec4899]/10 border-[#ec4899]/20', icon: Users },
    finance: { color: 'text-success bg-success-tint border-success/20', icon: DollarSign },
    manager: { color: 'text-warning bg-warning-tint border-warning/20', icon: UserCog },
    employee: { color: 'text-text-muted bg-surface-2 border-border', icon: User },
  };

  const { color, icon: Icon } = config[normalizedRole] || config.employee;

  return (
    <Badge variant="outline" className={cn(`gap-1.5 font-medium capitalize pl-1.5 pr-2.5 ${color}`, className)}>
      <Icon className="w-3.5 h-3.5" />
      {role}
    </Badge>
  );
}
