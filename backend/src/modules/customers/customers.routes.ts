import { Router } from 'express';
import { customersController } from './customers.controller.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate.js';
import { createCustomerSchema, updateCustomerSchema } from './customers.schemas.js';

const router = Router();

router.get('/', authenticateUser, customersController.getCustomers);
router.get('/:id', authenticateUser, customersController.getCustomerById);
router.post('/', authenticateUser, validateRequest(createCustomerSchema), customersController.createCustomer);
router.put('/:id', authenticateUser, validateRequest(updateCustomerSchema), customersController.updateCustomer);

export default router;

