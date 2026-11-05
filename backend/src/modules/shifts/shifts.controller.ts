import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { shiftsService, ShiftsService } from './shifts.service.js';

export class ShiftsController {
  constructor(private readonly service: ShiftsService = shiftsService) {}

  public getCurrentShift = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(this.service.getCurrentShift(req.user!));
    } catch (err) {
      next(err);
    }
  };

  public startShift = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(this.service.startShift(req.user!, req.body));
    } catch (err) {
      next(err);
    }
  };

  public closeShift = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(this.service.closeShift(req.user!, req.body));
    } catch (err) {
      next(err);
    }
  };
}

export const shiftsController = new ShiftsController();

