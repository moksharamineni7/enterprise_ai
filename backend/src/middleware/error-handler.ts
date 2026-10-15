import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.status || err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected internal error occurred.';

  // Log error on server without leaking sensitive info
  console.error(`[ERROR] [${new Date().toISOString()}] ${req.method} ${req.originalUrl}:`, {
    status: statusCode,
    code: errorCode,
    message: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: statusCode === 500 && env.NODE_ENV === 'production'
        ? 'Internal server error. Please try again later.'
        : message,
      details: err.details || undefined,
    },
  });
}
