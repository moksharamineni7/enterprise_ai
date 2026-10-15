import { Router } from 'express';
import {
  listWorkflows,
  createWorkflow,
  getWorkflowById,
  publishWorkflow,
  executeWorkflow,
  getWorkflowRecommendations,
  getWorkflowExecutions,
} from '../controllers/workflow.controller';
import { authenticateMiddleware } from '../middleware/authenticate';
import { requireOrgMember, requireRole } from '../middleware/authorize';
import { validateBody } from '../middleware/validate';
import { aiRateLimiter } from '../middleware/rate-limit';
import { createWorkflowSchema, executeWorkflowSchema } from '../schemas';

const router = Router();

router.use(authenticateMiddleware, requireOrgMember);

router.get('/', listWorkflows);
router.post('/', requireRole(['admin', 'manager']), validateBody(createWorkflowSchema), createWorkflow);

router.get('/:workflowId', getWorkflowById);
router.post('/:workflowId/publish', requireRole(['admin', 'manager']), publishWorkflow);
router.post('/:workflowId/execute', validateBody(executeWorkflowSchema), executeWorkflow);
router.get('/:workflowId/executions', getWorkflowExecutions);
router.post('/:workflowId/recommendations', aiRateLimiter, getWorkflowRecommendations);

export default router;
