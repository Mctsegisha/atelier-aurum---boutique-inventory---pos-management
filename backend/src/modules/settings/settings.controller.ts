import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { settingsService, SettingsService } from './settings.service.js';

export class SettingsController {
  constructor(private readonly service: SettingsService = settingsService) {}

  public getSettings = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(this.service.getSettings());
    } catch (err) {
      next(err);
    }
  };

  public updateSettings = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(this.service.updateSettings(req.user!, req.body));
    } catch (err) {
      next(err);
    }
  };
}

export const settingsController = new SettingsController();

