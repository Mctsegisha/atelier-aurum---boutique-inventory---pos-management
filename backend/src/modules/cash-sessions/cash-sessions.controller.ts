import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { cashSessionsService, CashSessionsService } from './cash-sessions.service.js';

export class CashSessionsController {
  constructor(private readonly service: CashSessionsService = cashSessionsService) {}

  public getSessionData = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(this.service.getSessionData());
    } catch (err) {
      next(err);
    }
  };

  public getActiveSession = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json({ session: this.service.getActiveSession() });
    } catch (err) {
      next(err);
    }
  };

  public openSession = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const created = this.service.openSession(req.user!, req.body);
      res.status(201).json({ session: created });
    } catch (err) {
      next(err);
    }
  };

  public closeSession = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.params.id;
      const closed = this.service.closeSession(sessionId, req.user!, req.body);
      res.json({ session: closed });
    } catch (err) {
      next(err);
    }
  };
}

export const cashSessionsController = new CashSessionsController();
