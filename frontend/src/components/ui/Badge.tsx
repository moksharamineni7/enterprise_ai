import React from 'react';
import clsx from 'clsx';
import { TaskPriority, TaskStatus, ApprovalStatus, InsightSeverity, DocumentProcessingStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variantStyles = {
    default: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    info: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    neutral: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border tracking-wide uppercase',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: TaskStatus | ApprovalStatus | DocumentProcessingStatus }) {
  const map: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
    todo: { label: 'To Do', variant: 'neutral' },
    in_progress: { label: 'In Progress', variant: 'info' },
    blocked: { label: 'Blocked', variant: 'danger' },
    completed: { label: 'Completed', variant: 'success' },
    pending: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
    cancelled: { label: 'Cancelled', variant: 'neutral' },
    uploaded: { label: 'Uploaded', variant: 'neutral' },
    processing: { label: 'Processing', variant: 'info' },
    failed: { label: 'Failed', variant: 'danger' },
  };

  const item = map[status] || { label: status, variant: 'neutral' };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority | InsightSeverity }) {
  const map: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'neutral' }> = {
    low: { label: 'Low', variant: 'neutral' },
    medium: { label: 'Medium', variant: 'default' },
    high: { label: 'High', variant: 'warning' },
    critical: { label: 'Critical', variant: 'danger' },
  };

  const item = map[priority] || { label: priority, variant: 'neutral' };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
