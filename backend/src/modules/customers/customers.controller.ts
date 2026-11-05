import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { customersService, CustomersService } from './customers.service.js';

export class CustomersController {
  constructor(private readonly service: CustomersService = customersService) {}

  public getCustomers = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { search, limit = '50' } = req.query;
      res.json(this.service.getCustomers(search as string, Number(limit)));
    } catch (err) {
      next(err);
    }
  };

  public getCustomerById = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      res.json(this.service.getCustomerById(id));
    } catch (err) {
      next(err);
    }
  };

  public createCustomer = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(this.service.createCustomer(req.user!, req.body));
    } catch (err) {
      next(err);
    }
  };

  public updateCustomer = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      res.json(this.service.updateCustomer(id, req.user!, req.body));
    } catch (err) {
      next(err);
    }
  };
}

export const customersController = new CustomersController();

