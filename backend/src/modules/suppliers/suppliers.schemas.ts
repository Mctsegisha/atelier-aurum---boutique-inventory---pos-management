import { z } from 'zod';

export const createSupplierSchema = {
  body: z.object({
    company_name: z.string().min(1, 'Company name is required').max(100),
    contact_person: z.string().max(100).optional().nullable(),
    phone: z.string().max(30).optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal('')),
    address: z.string().max(255).optional().nullable(),
    products_supplied: z.string().optional().nullable()
  })
};

export const updateSupplierSchema = {
  body: z.object({
    company_name: z.string().min(1).max(100).optional(),
    contact_person: z.string().max(100).optional().nullable(),
    phone: z.string().max(30).optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal('')),
    address: z.string().max(255).optional().nullable(),
    products_supplied: z.string().optional().nullable(),
    balance_due: z.coerce.number().optional()
  })
};

export const createPoSchema = {
  body: z.object({
    supplier_id: z.string().min(1, 'Supplier ID is required'),
    expected_date: z.string().optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
    items: z
      .array(
        z.object({
          variant_id: z.string().min(1),
          quantity_ordered: z.coerce.number().int().positive(),
          unit_cost: z.coerce.number().min(0)
        })
      )
      .min(1, 'At least one item is required in purchase order')
  })
};

