import { Router } from 'express';
import multer from 'multer';
import {
  listDocuments,
  uploadDocument,
  getDocumentById,
  analyzeDocument,
  getDocumentStatus,
  getDocumentDownloadUrl,
  acceptActionItems,
  deleteDocument,
} from '../controllers/document.controller';
import { authenticateMiddleware } from '../middleware/authenticate';
import { requireOrgMember } from '../middleware/authorize';
import { validateBody } from '../middleware/validate';
import { aiRateLimiter } from '../middleware/rate-limit';
import { acceptActionItemsSchema } from '../schemas';
import { env } from '../config/env';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_BYTES,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.txt') || file.originalname.endsWith('.md')) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported document format. Allowed types: PDF, TXT, MD, DOCX.'));
    }
  },
});

const router = Router();

router.use(authenticateMiddleware, requireOrgMember);

router.get('/', listDocuments);
router.post('/upload', upload.single('file'), uploadDocument);

router.get('/:documentId', getDocumentById);
router.get('/:documentId/download', getDocumentDownloadUrl);
router.post('/:documentId/analyze', aiRateLimiter, analyzeDocument);
router.get('/:documentId/status', getDocumentStatus);
router.post('/:documentId/action-items', validateBody(acceptActionItemsSchema), acceptActionItems);
router.delete('/:documentId', deleteDocument);

export default router;
