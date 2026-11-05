import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { posService, PosService } from './pos.service.js';

export class PosController {
  constructor(private readonly service: PosService = posService) {}

  public checkout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cashierId = req.user!.id;
      const result = await this.service.processCheckout(cashierId, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };
}

export const posController = new PosController();

