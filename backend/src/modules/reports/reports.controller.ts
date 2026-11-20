import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { reportsService, ReportsService } from './reports.service.js';

export class ReportsController {
  constructor(private readonly service: ReportsService = reportsService) {}

  public getSalesReport = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const period = (req.query.period as string) || '30d';
      const groupBy = (req.query.groupBy as 'day' | 'week' | 'month') || 'day';
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const data = this.service.getSalesReport(period, groupBy, startDate, endDate);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  public getPnlReport = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const period = (req.query.period as string) || '30d';
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const data = this.service.getPnlReport(period, startDate, endDate);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  public getStockValueReport = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = this.service.getStockValueReport();
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  public getChannelsReport = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const period = (req.query.period as string) || '30d';
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const data = this.service.getChannelsReport(period, startDate, endDate);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  public getOwedToUsReport = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = this.service.getOwedToUsReport();
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  public settleCustomerCredit = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updated = this.service.settleCustomerCredit(req.user!, req.body);
      res.json({ success: true, customer: updated });
    } catch (err) {
      next(err);
    }
  };

  public getWastageReport = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const atRiskDays = req.query.atRiskDays ? parseInt(req.query.atRiskDays as string, 10) : 30;
      const data = this.service.getWastageReport(atRiskDays);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  public getDashboard = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const period = (req.query.period as string) || 'day';
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const data = this.service.getDashboardData(req.user!, period, startDate, endDate);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };
}

export const reportsController = new ReportsController();
