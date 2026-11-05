import { z } from 'zod';

export const createProductSchema = {
  body: z.object({
    name: z.string().min(1, 'Product name is required').max(200),
    description: z.string().optional().nullable(),
    category_id: z.string().optional().nullable(),
    subcategory_id: z.string().optional().nullable(),
    brand_id: z.string().optional().nullable(),
    supplier_id: z.string().optional().nullable(),
    purchase_price: z.coerce.number().min(0).default(0),
    selling_price: z.coerce.number().min(0).default(0),
    wholesale_price: z.coerce.number().min(0).default(0),
    tax_rate: z.coerce.number().min(0).max(1).default(0.15),
    min_stock_level: z.coerce.number().int().min(0).default(5),
    image_url: z.string().optional().nullable(),
    is_simple: z.coerce.number().int().min(0).max(1).default(0),
    season: z.string().optional().nullable(),
    collection: z.string().optional().nullable(),
    gender: z.string().optional().nullable(),
    material: z.string().optional().nullable(),
    attributes: z.any().optional().nullable(),
    variants: z.array(z.any()).optional().default([]),
    initial_stock: z.coerce.number().int().min(0).default(0),
    sku: z.string().optional().nullable(),
    barcode: z.string().optional().nullable()
  })
};

export const updateProductSchema = {
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    category_id: z.string().optional().nullable(),
    subcategory_id: z.string().optional().nullable(),
    brand_id: z.string().optional().nullable(),
    supplier_id: z.string().optional().nullable(),
    purchase_price: z.coerce.number().min(0).optional(),
    selling_price: z.coerce.number().min(0).optional(),
    wholesale_price: z.coerce.number().min(0).optional(),
    tax_rate: z.coerce.number().min(0).max(1).optional(),
    min_stock_level: z.coerce.number().int().min(0).optional(),
    image_url: z.string().optional().nullable(),
    status: z.enum(['active', 'draft', 'pending_approval', 'rejected', 'archived']).optional(),
    is_simple: z.coerce.number().int().min(0).max(1).optional(),
    season: z.string().optional().nullable(),
    collection: z.string().optional().nullable(),
    gender: z.string().optional().nullable(),
    material: z.string().optional().nullable(),
    attributes: z.any().optional().nullable(),
    variants: z.array(z.any()).optional()
  })
};

export const rejectProductSchema = {
  body: z.object({
    rejectionReason: z.string().min(1, 'Rejection reason is required')
  })
};

