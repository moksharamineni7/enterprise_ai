import { Router } from 'express';
import {
  listConversations,
  createConversation,
  getConversationMessages,
  sendMessage,
  renameConversation,
  deleteConversation,
} from '../controllers/assistant.controller';
import { authenticateMiddleware } from '../middleware/authenticate';
import { requireOrgMember } from '../middleware/authorize';
import { aiRateLimiter } from '../middleware/rate-limit';

const router = Router();

router.use(authenticateMiddleware, requireOrgMember);

router.get('/conversations', listConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:conversationId/messages', getConversationMessages);
router.post('/conversations/:conversationId/messages', aiRateLimiter, sendMessage);
router.patch('/conversations/:conversationId', renameConversation);
router.delete('/conversations/:conversationId', deleteConversation);

export default router;
