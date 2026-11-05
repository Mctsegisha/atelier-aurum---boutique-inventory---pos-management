import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { productsService, ProductsService } from './products.service.js';

export class ProductsController {
  constructor(private readonly service: ProductsService = productsService) {}

  public getProducts = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = this.service.getProducts(req.user!, req.query);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  public getByBarcode = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { barcode } = req.params;
      const data = this.service.getByBarcode(barcode, req.user!);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  public getPendingApprovalCount = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(this.service.getPendingApprovalCount());
    } catch (err) {
      next(err);
    }
  };

  public createProduct = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = this.service.createProduct(req.user!, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  public updateProduct = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = this.service.updateProduct(id, req.user!, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  public approveProduct = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = this.service.approveProduct(id, req.user!);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  public rejectProduct = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const result = this.service.rejectProduct(id, rejectionReason, req.user!);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  public deleteProduct = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = this.service.deleteProduct(id, req.user!);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  // Categories
  public getCategories = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(this.service.getCategories());
    } catch (err) {
      next(err);
    }
  };

  public createCategory = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { name, description } = req.body;
      res.status(201).json(this.service.createCategory(name, description));
    } catch (err) {
      next(err);
    }
  };

  public updateCategory = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, description, is_active } = req.body;
      res.json(this.service.updateCategory(id, name, description, is_active));
    } catch (err) {
      next(err);
    }
  };

  // Subcategories
  public getSubcategories = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { category_id } = req.query;
      res.json(this.service.getSubcategories(category_id as string));
    } catch (err) {
      next(err);
    }
  };

  public createSubcategory = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { category_id, name, description } = req.body;
      res.status(201).json(this.service.createSubcategory(category_id, name, description));
    } catch (err) {
      next(err);
    }
  };

  public updateSubcategory = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { category_id, name, description, is_active } = req.body;
      res.json(this.service.updateSubcategory(id, category_id, name, description, is_active));
    } catch (err) {
      next(err);
    }
  };

  public deleteSubcategory = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      res.json(this.service.deleteSubcategory(id));
    } catch (err) {
      next(err);
    }
  };

  // Brands
  public getBrands = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(this.service.getBrands());
    } catch (err) {
      next(err);
    }
  };

  public createBrand = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { name, country } = req.body;
      res.status(201).json(this.service.createBrand(name, country));
    } catch (err) {
      next(err);
    }
  };
}

export const productsController = new ProductsController();

