import { Router } from 'express';
import { expensesController } from './expenses.controller.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validate.js';
import { createExpenseSchema } from './expenses.schemas.js';

const router = Router();

router.get('/', authenticateUser, requireRole(['admin', 'store_person']), expensesController.getExpenses);
router.get('/categories/all', authenticateUser, requireRole(['admin', 'store_person']), expensesController.getCategories);
router.post('/', authenticateUser, requireRole(['admin', 'store_person']), validateRequest(createExpenseSchema), expensesController.createExpense);
router.delete('/:id', authenticateUser, requireRole(['admin']), expensesController.deleteExpense);

export default router;

