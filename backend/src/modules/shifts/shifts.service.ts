import { ShiftsRepository, shiftsRepository } from './shifts.repository.js';
import { generateId } from '../../utils/idGenerator.js';
import { auditService } from '../audit/audit.service.js';
import { BadRequestError } from '../../errors/AppError.js';
import { AuthUser } from '../../middleware/authenticate.js';

export class ShiftsService {
  constructor(private readonly repo: ShiftsRepository = shiftsRepository) {}

  public getCurrentShift(user: AuthUser) {
    const shift = this.repo.getActiveShift(user.id);
    return { shift: shift || null };
  }

  public startShift(user: AuthUser, body: any) {
    const existing = this.repo.getActiveShift(user.id);
    if (existing) {
      throw new BadRequestError('You already have an active shift session open.');
    }

    const startingCash = Number(body.starting_cash || 200.0);
    const shiftId = generateId('shift');
    const created = this.repo.createShift(shiftId, user.id, startingCash, body.notes);

    auditService.log(user.id, 'START_SHIFT', 'SHIFT', shiftId, { starting_cash: startingCash });
    return created;
  }

  public closeShift(user: AuthUser, body: any) {
    const current = this.repo.getActiveShift(user.id) as any;
    if (!current) {
      throw new BadRequestError('No active shift found to close.');
    }

    const endingCash = Number(body.ending_cash || 0);
    const closed = this.repo.closeShift(current.id, endingCash, body.notes);

    auditService.log(user.id, 'CLOSE_SHIFT', 'SHIFT', current.id, { ending_cash: endingCash });
    return closed;
  }
}

export const shiftsService = new ShiftsService();

