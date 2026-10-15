import { Router } from 'express';
import {
  getDashboardSummary,
  getDashboardActivity,
  getDashboardTrends,
} from '../controllers/dashboard.controller';
import { authenticateMiddleware } from '../middleware/authenticate';
import { requireOrgMember } from '../middleware/authorize';

const router = Router();

router.use(authenticateMiddleware, requireOrgMember);

router.get('/summary', getDashboardSummary);
router.get('/activity', getDashboardActivity);
router.get('/trends', getDashboardTrends);

export default router;
