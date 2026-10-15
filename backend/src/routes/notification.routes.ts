import { Router } from 'express';
import {
  listNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notification.controller';
import { authenticateMiddleware } from '../middleware/authenticate';

const router = Router();

router.use(authenticateMiddleware);

router.get('/', listNotifications);
router.patch('/:notificationId/read', markNotificationAsRead);
router.post('/read-all', markAllNotificationsAsRead);

export default router;
