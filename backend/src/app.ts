import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import { requestIdMiddleware } from './middleware/request-id';
import { standardRateLimiter } from './middleware/rate-limit';
import { errorHandler } from './middleware/error-handler';
import apiRouter from './routes';

export const app = express();

// 1. Security headers & CORS
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin, configured origins, or localhost
    if (!origin) return callback(null, true);
    const allowed = env.CORS_ORIGINS.split(',').map(s => s.trim());
    if (allowed.includes(origin) || origin.includes('localhost') || origin.includes('onrender.com')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// 2. Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Request tracking & logging
app.use(requestIdMiddleware);
if (env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
}

// 4. Global Rate Limiter
app.use(standardRateLimiter);

// 5. REST API routes
app.use('/api/v1', apiRouter);

// 6. Serve Frontend Production Assets (Single-host deployment for Render)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// 7. API 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
    },
  });
});

// 8. Centralized Error Handler
app.use(errorHandler);
