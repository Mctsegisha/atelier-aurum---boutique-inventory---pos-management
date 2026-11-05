import bcrypt from 'bcryptjs';
import { authRepository, AuthRepository, ProfileRecord } from './auth.repository.js';
import { generateToken } from '../../middleware/authenticate.js';
import { auditService } from '../audit/audit.service.js';
import { UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError } from '../../errors/AppError.js';
import { env } from '../../config/env.js';

export class AuthService {
  constructor(private readonly repo: AuthRepository = authRepository) {}

  public async login(credential: string, passwordPlain: string, ipAddress = '127.0.0.1') {
    const user = this.repo.findByCredential(credential);
    if (!user) {
      throw new UnauthorizedError('Invalid login credentials.');
    }

    if (!user.is_active) {
      throw new ForbiddenError('Your staff account is currently inactive. Contact your boutique administrator.');
    }

    // Non-blocking async password comparison
    const isMatch = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isMatch) {
      auditService.log(user.id, 'LOGIN_FAILED', 'AUTH', user.id, { reason: 'bad_password' }, undefined, ipAddress);
      throw new UnauthorizedError('Invalid login credentials.');
    }

    const token = generateToken(user);
    auditService.log(user.id, 'LOGIN_SUCCESS', 'AUTH', user.id, { role: user.role }, undefined, ipAddress);

    return {
      token,
      user: this.sanitizeUser(user)
    };
  }

  public async changePassword(userId: string, currentPlain: string, newPlain: string) {
    const user = this.repo.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found.');
    }

    const isMatch = await bcrypt.compare(currentPlain, user.password_hash);
    if (!isMatch) {
      throw new BadRequestError('Current password does not match.');
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPlain, salt);

    this.repo.updatePassword(userId, newHash);
    auditService.log(userId, 'PASSWORD_CHANGE', 'PROFILE', userId);

    return { message: 'Password updated successfully.' };
  }

  public quickSwitchRole(targetRole: 'admin' | 'store_person' | 'sales', bypassKey?: string) {
    // Defense-in-depth: In production, enforce secret key verification or disable
    if (env.NODE_ENV === 'production') {
      if (!bypassKey || bypassKey !== env.DEMO_SECRET_KEY) {
        throw new ForbiddenError('Quick role switching is restricted in production mode.');
      }
    }

    const user = this.repo.findActiveByRole(targetRole);
    if (!user) {
      throw new NotFoundError(`No active ${targetRole} user found in boutique system.`);
    }

    const token = generateToken(user);
    auditService.log(user.id, 'QUICK_SWITCH', 'AUTH', user.id, { role: user.role });

    return {
      token,
      user: this.sanitizeUser(user)
    };
  }

  public sanitizeUser(user: ProfileRecord) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      avatar_url: user.avatar_url,
      phone: user.phone
    };
  }
}

export const authService = new AuthService();

