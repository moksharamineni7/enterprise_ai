import { Router } from 'express';
import {
  listApprovals,
  getApprovalById,
  createApproval,
  approveApproval,
  rejectApproval,
} from '../controllers/approval.controller';
import { authenticateMiddleware } from '../middleware/authenticate';
import { requireOrgMember } from '../middleware/authorize';
import { validateBody } from '../middleware/validate';
import { createApprovalSchema, decideApprovalSchema } from '../schemas';

const router = Router();

router.use(authenticateMiddleware, requireOrgMember);

router.get('/', listApprovals);
router.post('/', validateBody(createApprovalSchema), createApproval);

router.get('/:approvalId', getApprovalById);
router.post('/:approvalId/approve', validateBody(decideApprovalSchema.partial()), approveApproval);
router.post('/:approvalId/reject', validateBody(decideApprovalSchema.partial()), rejectApproval);

export default router;
