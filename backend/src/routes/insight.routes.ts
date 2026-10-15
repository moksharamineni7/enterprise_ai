import { Router } from 'express';
import {
  listInsights,
  generateInsights,
  updateInsightStatus,
} from '../controllers/insight.controller';
import { authenticateMiddleware } from '../middleware/authenticate';
import { requireOrgMember } from '../middleware/authorize';
import { aiRateLimiter } from '../middleware/rate-limit';

const router = Router();

router.use(authenticateMiddleware, requireOrgMember);

router.get('/', listInsights);
router.post('/generate', aiRateLimiter, generateInsights);
router.patch('/:insightId', updateInsightStatus);

export default router;
