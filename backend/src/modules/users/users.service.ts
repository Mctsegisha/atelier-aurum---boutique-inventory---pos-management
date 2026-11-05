import bcrypt from 'bcryptjs';
import { UsersRepository, usersRepository } from './users.repository.js';
import { generateId } from '../../utils/idGenerator.js';
import { auditService } from '../audit/audit.service.js';
import { NotFoundError, ConflictError, BadRequestError } from '../../errors/AppError.js';
import { AuthUser } from '../../middleware/authenticate.js';

export class UsersService {
  constructor(private readonly repo: UsersRepository = usersRepository) {}

  public getUsers() {
    return this.repo.getAll();
  }

  public async createUser(adminUser: AuthUser, body: any) {
    const { username, email, password, full_name, role, phone, avatar_url } = body;

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const id = generateId('u');

    try {
      const created = this.repo.create({
        id,
        username,
        email,
        passwordHash: hash,
        fullName: full_name,
        role,
        phone,
        avatarUrl: avatar_url
      });

      auditService.log(adminUser.id, 'CREATE_USER', 'USER', id, { username, role });
      return created;
    } catch (err: any) {
      if (err.message?.includes('UNIQUE')) {
        throw new ConflictError('Username or email already in use.');
      }
      throw err;
    }
  }

  public async updateUser(id: string, adminUser: AuthUser, body: any) {
    const existing = this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found.');
    }

    let passwordHash: string | undefined;
    if (body.new_password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(body.new_password, salt);
    }

    const updated = this.repo.update(id, {
      ...body,
      passwordHash
    });

    auditService.log(adminUser.id, 'UPDATE_USER', 'USER', id, { username: body.username, role: body.role });
    return updated;
  }

  public toggleUserActive(id: string, adminUser: AuthUser) {
    const existing = this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found.');
    }

    if (existing.id === adminUser.id) {
      throw new BadRequestError('You cannot deactivate your own administrative account.');
    }

    const newStatus = existing.is_active ? 0 : 1;
    this.repo.toggleActive(id, newStatus);
    auditService.log(adminUser.id, 'TOGGLE_USER_ACTIVE', 'USER', id, { is_active: newStatus });

    return {
      is_active: newStatus,
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully.`
    };
  }
}

export const usersService = new UsersService();

