import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { EnterpriseDataStore } from '../repositories/data.store';

export async function listNotifications(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.id;
  const notifications = EnterpriseDataStore.notifications
    .filter(n => n.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const unreadCount = notifications.filter(n => !n.read_at).length;

  res.json({
    success: true,
    data: {
      notifications,
      unread_count: unreadCount,
    },
  });
}

export async function markNotificationAsRead(req: AuthenticatedRequest, res: Response) {
  const { notificationId } = req.params;
  const userId = req.user!.id;

  const notif = EnterpriseDataStore.notifications.find(n => n.id === notificationId && n.user_id === userId);
  if (!notif) {
    res.status(404).json({
      success: false,
      error: { code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found.' },
    });
    return;
  }

  notif.read_at = new Date().toISOString();

  res.json({
    success: true,
    data: notif,
  });
}

export async function markAllNotificationsAsRead(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.id;
  const now = new Date().toISOString();

  EnterpriseDataStore.notifications
    .filter(n => n.user_id === userId && !n.read_at)
    .forEach(n => {
      n.read_at = now;
    });

  res.json({
    success: true,
    data: { message: 'All notifications marked as read.' },
  });
}
