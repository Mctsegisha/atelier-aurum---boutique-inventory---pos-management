import { Router } from 'express';
import { productsController } from './products.controller.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validate.js';
import { createProductSchema, updateProductSchema, rejectProductSchema } from './products.schemas.js';

const router = Router();

// Approval count
router.get('/approval/pending-count', authenticateUser, productsController.getPendingApprovalCount);

// Categories
router.get('/categories/all', authenticateUser, productsController.getCategories);
router.post('/categories', authenticateUser, requireRole(['admin', 'store_person']), productsController.createCategory);
router.put('/categories/:id', authenticateUser, requireRole(['admin', 'store_person']), productsController.updateCategory);

// Subcategories
router.get('/subcategories/all', authenticateUser, productsController.getSubcategories);
router.post('/subcategories', authenticateUser, requireRole(['admin', 'store_person']), productsController.createSubcategory);
router.put('/subcategories/:id', authenticateUser, requireRole(['admin', 'store_person']), productsController.updateSubcategory);
router.delete('/subcategories/:id', authenticateUser, requireRole(['admin', 'store_person']), productsController.deleteSubcategory);

// Brands
router.get('/brands/all', authenticateUser, productsController.getBrands);
router.post('/brands', authenticateUser, requireRole(['admin', 'store_person']), productsController.createBrand);

// Products
router.get('/', authenticateUser, productsController.getProducts);
router.get('/barcode/:barcode', authenticateUser, productsController.getByBarcode);
router.post('/', authenticateUser, requireRole(['admin', 'store_person']), validateRequest(createProductSchema), productsController.createProduct);
router.post('/:id/approve', authenticateUser, requireRole(['admin']), productsController.approveProduct);
router.post('/:id/reject', authenticateUser, requireRole(['admin']), validateRequest(rejectProductSchema), productsController.rejectProduct);
router.put('/:id', authenticateUser, requireRole(['admin', 'store_person']), validateRequest(updateProductSchema), productsController.updateProduct);
router.delete('/:id', authenticateUser, requireRole(['admin']), productsController.deleteProduct);

export default router;

