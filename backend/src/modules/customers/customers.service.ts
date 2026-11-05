import { CustomersRepository, customersRepository } from './customers.repository.js';
import { generateId } from '../../utils/idGenerator.js';
import { auditService } from '../audit/audit.service.js';
import { NotFoundError, ConflictError } from '../../errors/AppError.js';
import { AuthUser } from '../../middleware/authenticate.js';

export class CustomersService {
  constructor(private readonly repo: CustomersRepository = customersRepository) {}

  public getCustomers(search?: string, limit = 50) {
    return this.repo.getAll(search, limit);
  }

  public getCustomerById(id: string) {
    const customer = this.repo.getById(id);
    if (!customer) {
      throw new NotFoundError('Customer not found.');
    }
    return customer;
  }

  public createCustomer(user: AuthUser, body: any) {
    const id = generateId('c');
    try {
      const created = this.repo.create({
        id,
        fullName: body.full_name.trim(),
        phone: body.phone ? body.phone.trim() : null,
        email: body.email ? body.email.trim() : null,
        address: body.address ? body.address.trim() : null,
        birthday: body.birthday || null,
        notes: body.notes || null
      });

      auditService.log(user.id, 'CREATE_CUSTOMER', 'CUSTOMER', id, { full_name: body.full_name, phone: body.phone });
      return created;
    } catch (err: any) {
      if (err.message?.includes('UNIQUE')) {
        throw new ConflictError('A customer with this phone number already exists.');
      }
      throw err;
    }
  }

  public updateCustomer(id: string, user: AuthUser, body: any) {
    const existing = this.repo.getById(id);
    if (!existing) {
      throw new NotFoundError('Customer not found.');
    }

    const updated = this.repo.update(id, body);
    auditService.log(user.id, 'UPDATE_CUSTOMER', 'CUSTOMER', id, body);
    return updated;
  }
}

export const customersService = new CustomersService();

