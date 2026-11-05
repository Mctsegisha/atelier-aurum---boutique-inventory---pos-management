import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../constants/httpStatusCodes.js';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: { windowMs: number; max: number; message: string }) {
  const hits = new Map<string, RateLimitRecord>();

  // Cleanup expired entries periodically to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(ip);
      }
    }
  }, Math.min(options.windowMs, 60000));

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = hits.get(ip);
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + options.windowMs
      };
      hits.set(ip, record);
      return next();
    }

    record.count += 1;
    if (record.count > options.max) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        error: options.message
      });
      return;
    }

    next();
  };
}

// General API Rate Limiter (1000 requests per 15 min)
export const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP. Please try again later.'
});

// Strict Auth Limiter (20 attempts per 15 min per IP)
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts. Please wait 15 minutes before trying again.'
});

