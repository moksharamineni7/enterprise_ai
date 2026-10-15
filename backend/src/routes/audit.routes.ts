import { Router } from 'express';
import {
  listAuditLogs,
  getOrganizationSettings,
  updateOrganizationSettings,
} from '../controllers/audit.controller';
import { authenticateMiddleware } from '../middleware/authenticate';
import { requireOrgMember, requireRole } from '../middleware/authorize';

const router = Router();

router.use(authenticateMiddleware, requireOrgMember);

router.get('/audit-logs', requireRole(['admin', 'manager', 'executive']), listAuditLogs);
router.get('/organizations/:organizationId/settings', requireRole(['admin', 'manager']), getOrganizationSettings);
router.patch('/organizations/:organizationId/settings', requireRole(['admin']), updateOrganizationSettings);

export default router;
