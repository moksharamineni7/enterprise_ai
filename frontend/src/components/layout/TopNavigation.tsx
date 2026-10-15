import React, { useState } from 'react';
import { Menu, Search, Building2, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { NotificationBell } from './NotificationBell';
import { GlobalSearchModal } from './GlobalSearchModal';
import { UserRole } from '../../types';

export function TopNavigation({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, organization, logout, switchDemoRole } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const roles: UserRole[] = ['admin', 'manager', 'employee', 'executive'];

  return (
    <>
      <header className="h-16 glass-panel border-b border-slate-800/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Mobile Menu & Organization */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span className="text-xs sm:text-sm font-semibold text-white tracking-tight">
              {organization?.name || 'Apex Global Technologies'}
            </span>
          </div>
        </div>

        {/* Center: Search Trigger (Cmd+K) */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors w-72 text-xs"
        >
          <Search className="w-4 h-4 text-slate-500" />
          <span>Quick search records...</span>
          <kbd className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            ⌘K
          </kbd>
        </button>

        {/* Right: Role Switcher & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Role Switcher for Demonstration */}
          <div className="relative">
            <button
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 text-xs font-medium transition-colors"
              title="Switch demo user persona"
            >
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Persona:</span>
              <span className="capitalize">{user?.role || 'admin'}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-70" />
            </button>

            {isRoleMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl glass-panel border border-slate-700 p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Switch Active Role
                </p>
                {roles.map(r => (
                  <button
                    key={r}
                    onClick={() => {
                      switchDemoRole(r);
                      setIsRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs capitalize transition-colors flex items-center justify-between ${
                      user?.role === r
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{r}</span>
                    {user?.role === r && <span className="text-[10px]">Active</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search icon on mobile */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel border border-slate-700 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {user?.role}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors mt-1"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
