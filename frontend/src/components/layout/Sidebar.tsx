import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Bot,
  GitBranch,
  Inbox,
  Lightbulb,
  Users,
  ShieldCheck,
  Settings,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../lib/auth-context';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', href: '/app/tasks', icon: CheckSquare },
  { name: 'Documents', href: '/app/documents', icon: FileText },
  { name: 'Nexus AI', href: '/app/assistant', icon: Bot, badge: 'AI' },
  { name: 'Workflows', href: '/app/workflows', icon: GitBranch },
  { name: 'Approvals', href: '/app/approvals', icon: Inbox },
  { name: 'Insights', href: '/app/insights', icon: Lightbulb },
  { name: 'Team & Directory', href: '/app/team', icon: Users },
  { name: 'Audit Logs', href: '/app/audit-log', icon: ShieldCheck, roles: ['admin', 'manager', 'executive'] },
  { name: 'Settings', href: '/app/settings/organization', icon: Settings, roles: ['admin', 'manager'] },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose?: () => void }) {
  const { user } = useAuth();
  const userRole = user?.role || 'employee';

  const visibleItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 bottom-0 left-0 z-40 w-64 glass-panel border-r border-slate-800 flex flex-col transition-transform duration-200 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              NexusFlow <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">AI</span>
            </span>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Enterprise Ops</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Role Pill Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Active Role</span>
            <span className="px-2 py-0.5 rounded font-mono font-medium text-[11px] uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {userRole}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
