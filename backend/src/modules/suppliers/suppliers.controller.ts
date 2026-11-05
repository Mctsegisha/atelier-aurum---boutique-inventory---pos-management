import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { suppliersService, SuppliersService } from './suppliers.service.js';

export class SuppliersController {
  constructor(private readonly service: SuppliersService = suppliersService) {}

  public getSuppliers = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(this.service.getSuppliers());
    } catch (err) {
      next(err);
    }
  };

  public createSupplier = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(this.service.createSupplier(req.user!, req.body));
    } catch (err) {
      next(err);
    }
  };

  public updateSupplier = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      res.json(this.service.updateSupplier(id, req.user!, req.body));
    } catch (err) {
      next(err);
    }
  };

  public getPurchaseOrders = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(this.service.getPurchaseOrders());
    } catch (err) {
      next(err);
    }
  };

  public createPurchaseOrder = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(this.service.createPurchaseOrder(req.user!, req.body));
    } catch (err) {
      next(err);
    }
  };

  public receivePurchaseOrder = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      res.json(this.service.receivePurchaseOrder(id, req.user!));
    } catch (err) {
      next(err);
    }
  };
}

export const suppliersController = new SuppliersController();

