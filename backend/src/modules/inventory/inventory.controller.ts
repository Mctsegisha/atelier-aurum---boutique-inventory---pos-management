import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { inventoryService, InventoryService } from './inventory.service.js';

export class InventoryController {
  constructor(private readonly service: InventoryService = inventoryService) {}

  public getInventory = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = this.service.getInventory(req.user!, req.query);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  public adjustStock = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = this.service.adjustStock(req.user!, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  public receiveStock = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = this.service.receiveStock(req.user!, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  public getMovements = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = this.service.getMovements(req.query);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };
}

export const inventoryController = new InventoryController();

