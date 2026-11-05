import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { usersService, UsersService } from './users.service.js';

export class UsersController {
  constructor(private readonly service: UsersService = usersService) {}

  public getUsers = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(this.service.getUsers());
    } catch (err) {
      next(err);
    }
  };

  public createUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const created = await this.service.createUser(req.user!, req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  };

  public updateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updated = await this.service.updateUser(id, req.user!, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  };

  public toggleActive = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      res.json(this.service.toggleUserActive(id, req.user!));
    } catch (err) {
      next(err);
    }
  };
}

export const usersController = new UsersController();

