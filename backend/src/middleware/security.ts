import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Clickjacking protection
  res.setHeader('X-Frame-Options', 'DENY');

  // Disable legacy buggy XSS auditor in modern browsers
  res.setHeader('X-XSS-Protection', '0');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HSTS in production
  if (env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Remove fingerprinting header
  res.removeHeader('X-Powered-By');

  next();
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  const configuredOrigins = env.CORS_ORIGIN
    ? env.CORS_ORIGIN.split(',').map((s) => s.trim())
    : [];

  const defaultDevOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ];

  const isOriginAllowed =
    env.CORS_ORIGIN === '*' ||
    !origin ||
    defaultDevOrigins.includes(origin) ||
    configuredOrigins.includes(origin) ||
    configuredOrigins.some((allowed) => allowed.includes('*') && new RegExp('^' + allowed.replace(/\*/g, '.*') + '$').test(origin));

  if (origin && isOriginAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (!origin && env.CORS_ORIGIN === '*') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-demo-bypass-key'
  );

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
}

