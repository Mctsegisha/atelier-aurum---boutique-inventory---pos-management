import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { authService, AuthService } from './auth.service.js';

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { credential, password } = req.body;
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const result = await this.service.login(credential, password, ip);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  public me = (req: AuthenticatedRequest, res: Response): void => {
    res.json({ user: req.user });
  };

  public changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await this.service.changePassword(req.user!.id, currentPassword, newPassword);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  public quickSwitch = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { targetRole } = req.body;
      const bypassKey = req.headers['x-demo-bypass-key'] as string | undefined;
      const result = this.service.quickSwitchRole(targetRole, bypassKey);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();

