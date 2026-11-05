import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from '../database/connection.js';
import { env } from '../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError.js';
import { Role } from '../constants/roles.js';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: Role;
  phone?: string;
  avatar_url?: string;
  permissions?: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: { id: string; email: string; role: string; username: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      exp: Math.floor(Date.now() / 1000) + env.JWT_EXPIRES_IN_SECONDS
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): { id: string; role: string; username: string; email: string } {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new UnauthorizedError('Malformed token structure.');
  }

  const [header, payload, signature] = parts;

  // Constant-time signature comparison to defeat timing attacks
  const expectedSig = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new UnauthorizedError('Invalid session token signature.');
  }

  let decoded: any;
  try {
    decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    throw new UnauthorizedError('Corrupted token payload.');
  }

  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
    throw new UnauthorizedError('Session has expired. Please log in again.');
  }

  return decoded;
}

export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication required. Missing Bearer token.'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);

    const userRow = db.prepare(`
      SELECT p.id, p.username, p.email, p.full_name, p.role, p.is_active, p.phone, p.avatar_url
      FROM profiles p
      WHERE p.id = ?
    `).get(decoded.id) as (AuthUser & { is_active: number }) | undefined;

    if (!userRow) {
      return next(new UnauthorizedError('Staff profile no longer exists.'));
    }

    if (!userRow.is_active) {
      return next(new ForbiddenError('Staff account has been deactivated by administration.'));
    }

    // Role permissions lookup
    const permRows = db.prepare(`
      SELECT p.key
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
    `).all(userRow.role) as { key: string }[];

    req.user = {
      id: userRow.id,
      username: userRow.username,
      email: userRow.email,
      full_name: userRow.full_name,
      role: userRow.role as Role,
      phone: userRow.phone,
      avatar_url: userRow.avatar_url,
      permissions: permRows.map(r => r.key)
    };

    next();
  } catch (err) {
    next(err);
  }
}

