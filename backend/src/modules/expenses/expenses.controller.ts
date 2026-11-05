import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { expensesService, ExpensesService } from './expenses.service.js';

export class ExpensesController {
  constructor(private readonly service: ExpensesService = expensesService) {}

  public getExpenses = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(this.service.getExpenses(req.query));
    } catch (err) {
      next(err);
    }
  };

  public getCategories = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(this.service.getCategories());
    } catch (err) {
      next(err);
    }
  };

  public createExpense = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(this.service.createExpense(req.user!, req.body));
    } catch (err) {
      next(err);
    }
  };

  public deleteExpense = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      res.json(this.service.deleteExpense(id, req.user!));
    } catch (err) {
      next(err);
    }
  };
}

export const expensesController = new ExpensesController();

