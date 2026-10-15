import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Clock, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { NotificationItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<{ notifications: NotificationItem[]; unread_count: number }>('/notifications');
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient('/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-blue-400" /> Notifications Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of task assignments, approval requests, document completions, and workflow events.
          </p>
        </div>

        <Button size="sm" variant="secondary" onClick={handleMarkAllRead} leftIcon={<CheckCheck className="w-4 h-4" />}>
          Mark All as Read
        </Button>
      </div>

      <Card className="divide-y divide-slate-800/80 p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center text-slate-500">You are all caught up! No notifications.</div>
        ) : (
          notifications.map(item => (
            <div
              key={item.id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                !item.read_at ? 'bg-blue-500/5' : 'hover:bg-slate-800/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                    !item.read_at ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'
                  }`}
                />
                <div>
                  <h4 className={`text-sm ${!item.read_at ? 'font-semibold text-white' : 'text-slate-300'}`}>
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.message}</p>
                  <span className="text-[10px] text-slate-500 mt-1.5 block">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {!item.read_at && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleMarkAsRead(item.id)}
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                >
                  Mark Read
                </Button>
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
