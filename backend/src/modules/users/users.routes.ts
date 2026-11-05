import { Router } from 'express';
import { usersController } from './users.controller.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validate.js';
import { createUserSchema, updateUserSchema } from './users.schemas.js';

const router = Router();

router.get('/', authenticateUser, requireRole(['admin']), usersController.getUsers);
router.post('/', authenticateUser, requireRole(['admin']), validateRequest(createUserSchema), usersController.createUser);
router.put('/:id', authenticateUser, requireRole(['admin']), validateRequest(updateUserSchema), usersController.updateUser);
router.patch('/:id/toggle-active', authenticateUser, requireRole(['admin']), usersController.toggleActive);

export default router;

