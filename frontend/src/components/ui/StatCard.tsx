import React from 'react';
import clsx from 'clsx';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  onClick,
  className,
}: StatCardProps) {
  return (
    <Card
      hover={!!onClick}
      onClick={onClick}
      className={clsx('relative overflow-hidden cursor-default', onClick && 'cursor-pointer', className)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1.5 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              <span
                className={clsx(
                  'font-semibold',
                  trend.isNeutral
                    ? 'text-slate-400'
                    : trend.isPositive
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                )}
              >
                {trend.value}
              </span>
              <span className="text-slate-500">vs last cycle</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
