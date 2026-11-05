import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { reportsService, ReportsService } from './reports.service.js';

export class ReportsController {
  constructor(private readonly service: ReportsService = reportsService) {}

  public getDashboard = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const { period = '30d', startDate, endDate } = req.query as {
        period?: string;
        startDate?: string;
        endDate?: string;
      };
      const data = this.service.getDashboardData(req.user!, period, startDate, endDate);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };
}

export const reportsController = new ReportsController();

