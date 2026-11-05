import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate.js';
import { Role } from '../constants/roles.js';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError.js';

export function requireRole(allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Requires one of: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
        )
      );
    }
    next();
  };
}

export function requirePermission(permissionKey: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    // Admin has superuser authority across all operations
    if (req.user.role === 'admin') {
      return next();
    }
    if (!req.user.permissions || !req.user.permissions.includes(permissionKey)) {
      return next(new ForbiddenError(`Forbidden. Missing required permission: ${permissionKey}`));
    }
    next();
  };
}

