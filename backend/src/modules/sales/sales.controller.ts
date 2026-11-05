import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { salesService, SalesService } from './sales.service.js';

export class SalesController {
  constructor(private readonly service: SalesService = salesService) {}

  public getSales = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = this.service.getSales(req.user!, req.query);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  public getSaleById = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = this.service.getSaleById(id);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  public processRefund = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = this.service.processRefund(id, req.user!, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

export const salesController = new SalesController();

