import { Router } from 'express';
import { searchEnterprise } from '../controllers/search.controller';
import { authenticateMiddleware } from '../middleware/authenticate';
import { requireOrgMember } from '../middleware/authorize';

const router = Router();

router.use(authenticateMiddleware, requireOrgMember);

router.get('/', searchEnterprise);

export default router;
