import { Router } from 'express';
import authRoutes from './auth.routes';
import dashboardRoutes from './dashboard.routes';
import taskRoutes from './task.routes';
import documentRoutes from './document.routes';
import assistantRoutes from './assistant.routes';
import workflowRoutes from './workflow.routes';
import approvalRoutes from './approval.routes';
import insightRoutes from './insight.routes';
import searchRoutes from './search.routes';
import notificationRoutes from './notification.routes';
import auditRoutes from './audit.routes';

const router = Router();

// Mount all route modules
router.use('/', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/tasks', taskRoutes);
router.use('/documents', documentRoutes);
router.use('/', assistantRoutes);
router.use('/workflows', workflowRoutes);
router.use('/approvals', approvalRoutes);
router.use('/insights', insightRoutes);
router.use('/search', searchRoutes);
router.use('/notifications', notificationRoutes);
router.use('/', auditRoutes);

export default router;
