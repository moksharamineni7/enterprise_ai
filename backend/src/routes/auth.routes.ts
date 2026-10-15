import { Router } from 'express';
import {
  getHealth,
  getSupabaseStatus,
  getCurrentUser,
  createOrganization,
  listMembers,
  createInvitation,
  acceptInvitation,
  updateMember,
  deleteMember,
  listDepartments,
} from '../controllers/auth.controller';
import { authenticateMiddleware } from '../middleware/authenticate';
import { requireOrgMember, requireRole } from '../middleware/authorize';
import { validateBody } from '../middleware/validate';
import {
  createOrganizationSchema,
  createInvitationSchema,
  acceptInvitationSchema,
  updateMemberSchema,
} from '../schemas';

const router = Router();

router.get('/health', getHealth);
router.get('/supabase/status', getSupabaseStatus);
router.get('/me', authenticateMiddleware, getCurrentUser);

router.post('/organizations', authenticateMiddleware, validateBody(createOrganizationSchema), createOrganization);

router.get('/organizations/:organizationId/members', authenticateMiddleware, requireOrgMember, listMembers);
router.post(
  '/organizations/:organizationId/invitations',
  authenticateMiddleware,
  requireOrgMember,
  requireRole(['admin']),
  validateBody(createInvitationSchema),
  createInvitation
);
router.post('/invitations/accept', authenticateMiddleware, validateBody(acceptInvitationSchema), acceptInvitation);

router.patch(
  '/organizations/:organizationId/members/:memberId',
  authenticateMiddleware,
  requireOrgMember,
  requireRole(['admin']),
  validateBody(updateMemberSchema),
  updateMember
);
router.delete(
  '/organizations/:organizationId/members/:memberId',
  authenticateMiddleware,
  requireOrgMember,
  requireRole(['admin']),
  deleteMember
);

router.get('/organizations/:organizationId/departments', authenticateMiddleware, requireOrgMember, listDepartments);

export default router;
