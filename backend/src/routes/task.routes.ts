import { Router } from 'express';
import {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  addDependency,
  deleteDependency,
  aiPrioritizeAll,
} from '../controllers/task.controller';
import { authenticateMiddleware } from '../middleware/authenticate';
import { requireOrgMember } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validate';
import { aiRateLimiter } from '../middleware/rate-limit';
import {
  createTaskSchema,
  updateTaskSchema,
  taskFilterSchema,
  createTaskCommentSchema,
  createTaskDependencySchema,
} from '../schemas';

const router = Router();

router.use(authenticateMiddleware, requireOrgMember);

router.get('/', validateQuery(taskFilterSchema), listTasks);
router.post('/', validateBody(createTaskSchema), createTask);
router.post('/ai-prioritize-all', aiRateLimiter, aiPrioritizeAll);

router.get('/:taskId', getTaskById);
router.patch('/:taskId', validateBody(updateTaskSchema), updateTask);
router.delete('/:taskId', deleteTask);

router.post('/:taskId/comments', validateBody(createTaskCommentSchema), addComment);
router.post('/:taskId/dependencies', validateBody(createTaskDependencySchema), addDependency);
router.delete('/:taskId/dependencies/:dependencyId', deleteDependency);

export default router;
