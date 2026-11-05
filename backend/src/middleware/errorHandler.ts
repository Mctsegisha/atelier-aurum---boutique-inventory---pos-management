import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const message = isAppError ? err.message : 'Internal Server Error';

  if (!isAppError || statusCode >= 500) {
    logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(isAppError && err.details ? { details: err.details } : {}),
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}

