import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import { NotificationItem } from '../../types';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await apiClient<{ notifications: NotificationItem[]; unread_count: number }>('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.warn('Could not load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient('/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel border border-slate-700/80 p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 my-2">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No notifications yet</p>
            ) : (
              notifications.slice(0, 8).map(notif => (
                <div
                  key={notif.id}
                  className={`py-2.5 px-1.5 flex items-start justify-between gap-3 transition-colors rounded-lg hover:bg-slate-800/40 ${
                    !notif.read_at ? 'bg-blue-500/5' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${!notif.read_at ? 'font-semibold text-white' : 'text-slate-300'}`}>
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{notif.message}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {!notif.read_at && (
                    <button
                      onClick={e => markAsRead(notif.id, e)}
                      title="Mark as read"
                      className="p-1 rounded text-slate-500 hover:text-blue-400 hover:bg-slate-800"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 text-center">
            <Link
              to="/app/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              View all notification history →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
