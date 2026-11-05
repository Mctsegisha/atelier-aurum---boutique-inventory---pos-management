import { SettingsRepository, settingsRepository } from './settings.repository.js';
import { auditService } from '../audit/audit.service.js';
import { AuthUser } from '../../middleware/authenticate.js';

export class SettingsService {
  constructor(private readonly repo: SettingsRepository = settingsRepository) {}

  public getSettings() {
    return this.repo.get();
  }

  public updateSettings(user: AuthUser, body: any) {
    const updated = this.repo.update(body);
    auditService.log(user.id, 'UPDATE_SETTINGS', 'SETTINGS', 'cfg_default', body);
    return updated;
  }
}

export const settingsService = new SettingsService();

