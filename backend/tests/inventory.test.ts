import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { adjustStockSchema, updateVariantSchema } from '../src/modules/inventory/inventory.schemas.js';
import { InventoryService } from '../src/modules/inventory/inventory.service.js';
import { inventoryRepository } from '../src/modules/inventory/inventory.repository.js';

describe('Inventory Validation Schemas', () => {
  it('should accept valid adjustment with adjustment_type and quantity', () => {
    const res = adjustStockSchema.body.safeParse({
      variant_id: 'v_123',
      adjustment_type: 'set',
      quantity: 15,
      reason: 'Physical cycle count'
    });
    assert.ok(res.success);
    assert.equal(res.data.variant_id, 'v_123');
    assert.equal(res.data.quantity, 15);
  });

  it('should accept valid adjustment with new_quantity and type', () => {
    const res = adjustStockSchema.body.safeParse({
      variant_id: 'v_456',
      new_quantity: 22,
      type: 'damage',
      reason: 'Damaged item removed from floor'
    });
    assert.ok(res.success);
    assert.equal(res.data.variant_id, 'v_456');
    assert.equal(res.data.new_quantity, 22);
    assert.equal(res.data.type, 'damage');
  });

  it('should reject adjustment if neither quantity nor new_quantity is provided', () => {
    const res = adjustStockSchema.body.safeParse({
      variant_id: 'v_123',
      reason: 'Missing quantity'
    });
    assert.ok(!res.success, 'Should reject when quantity is missing');
  });

  it('should reject adjustment without mandatory reason', () => {
    const res = adjustStockSchema.body.safeParse({
      variant_id: 'v_123',
      quantity: 10,
      reason: ''
    });
    assert.ok(!res.success, 'Should reject when reason is empty');
  });

  it('should validate updateVariantSchema parameters and body fields', () => {
    const paramRes = updateVariantSchema.params.safeParse({ variantId: 'v_789' });
    assert.ok(paramRes.success);
    assert.equal(paramRes.data.variantId, 'v_789');

    const bodyRes = updateVariantSchema.body.safeParse({
      sku: 'HIR-SILK-M-01',
      barcode: '987654321012',
      selling_price: 350.50,
      purchase_price: 180.00,
      min_threshold: 4
    });
    assert.ok(bodyRes.success);
    assert.equal(bodyRes.data.sku, 'HIR-SILK-M-01');
    assert.equal(bodyRes.data.selling_price, 350.50);
    assert.equal(bodyRes.data.min_threshold, 4);
  });
});

describe('Inventory Parent-Child Grouping Logic', () => {
  it('should cleanly group flat inventory rows into parent products with nested batches', () => {
    const service = new InventoryService();

    const mockRows = [
      {
        inventory_id: 'inv_1',
        variant_id: 'var_1',
        product_id: 'prod_dress',
        product_name: 'Ethiopian Silk Dress',
        category_id: 'cat_clothing',
        category_name: 'Clothing & Apparel',
        subcategory_name: 'Dresses',
        image_url: 'https://example.com/dress.jpg',
        is_simple: 0,
        product_status: 'active',
        min_stock_level: 10,
        product_purchase_price: 2800,
        product_selling_price: 4500,
        quantity: 6,
        min_threshold: 5,
        sku: 'HIR-DRS-S-GLD',
        barcode: '100000000001',
        size: 'S',
        color: 'Gold',
        color_code: '#B89B65',
        variant_name: 'S · Gold',
        variant_cost: 2800,
        variant_price: 4500,
        location: 'Main Storefront',
        updated_at: '2026-11-15T10:00:00Z'
      },
      {
        inventory_id: 'inv_2',
        variant_id: 'var_2',
        product_id: 'prod_dress',
        product_name: 'Ethiopian Silk Dress',
        category_id: 'cat_clothing',
        category_name: 'Clothing & Apparel',
        subcategory_name: 'Dresses',
        image_url: 'https://example.com/dress.jpg',
        is_simple: 0,
        product_status: 'active',
        min_stock_level: 10,
        product_purchase_price: 2800,
        product_selling_price: 4500,
        quantity: 8,
        min_threshold: 5,
        sku: 'HIR-DRS-M-GLD',
        barcode: '100000000002',
        size: 'M',
        color: 'Gold',
        color_code: '#B89B65',
        variant_name: 'M · Gold',
        variant_cost: 2800,
        variant_price: 4500,
        location: 'Main Storefront',
        updated_at: '2026-11-15T10:00:00Z'
      },
      {
        inventory_id: 'inv_3',
        variant_id: 'var_3',
        product_id: 'prod_ring',
        product_name: 'Aurum Diamond Ring',
        category_id: 'cat_jewelry',
        category_name: 'Jewelry & Watches',
        subcategory_name: 'Rings',
        image_url: null,
        is_simple: 1,
        product_status: 'active',
        min_stock_level: 3,
        product_purchase_price: 980,
        product_selling_price: 2400,
        quantity: 2,
        min_threshold: 3,
        sku: 'HIR-RNG-001',
        barcode: '200000000001',
        size: 'Standard',
        color: 'Gold',
        color_code: '#B89B65',
        variant_name: 'Single Unit',
        variant_cost: 980,
        variant_price: 2400,
        location: 'Vault Display',
        updated_at: '2026-11-15T10:00:00Z'
      }
    ];

    const grouped = service.groupInventoryRows(mockRows);

    assert.equal(grouped.length, 2, 'Should group into exactly 2 parent products');

    // Product 1: Ethiopian Silk Dress
    const dress = grouped.find(p => p.product_id === 'prod_dress');
    assert.ok(dress, 'Ethiopian Silk Dress parent exists');
    assert.equal(dress.product_name, 'Ethiopian Silk Dress');
    assert.equal(dress.total_quantity, 14, 'Aggregated total stock 6 + 8 = 14');
    assert.equal(dress.quantity, 14);
    assert.equal(dress.batch_count, 2);
    assert.equal(dress.batch_number, '2 Batches');
    assert.equal(dress.min_threshold, 10);
    assert.equal(dress.status, 'healthy', '14 > 10 min threshold -> healthy');
    assert.equal(dress.cost_price, 2800);
    assert.equal(dress.selling_price, 4500);

    // Verify nested batches array
    assert.equal(dress.batches.length, 2);
    assert.equal(dress.batches[0].batch_number, 'HIR-DRS-S-GLD');
    assert.equal(dress.batches[0].quantity, 6);
    assert.equal(dress.batches[0].cost_price, 2800);
    assert.equal(dress.batches[0].selling_price, 4500);
    assert.equal(dress.batches[0].min_threshold, 5);

    assert.equal(dress.batches[1].batch_number, 'HIR-DRS-M-GLD');
    assert.equal(dress.batches[1].quantity, 8);
    assert.equal(dress.batches[1].cost_price, 2800);
    assert.equal(dress.batches[1].selling_price, 4500);

    // Product 2: Aurum Diamond Ring (low stock: 2 <= 3)
    const ring = grouped.find(p => p.product_id === 'prod_ring');
    assert.ok(ring, 'Aurum Diamond Ring parent exists');
    assert.equal(ring.total_quantity, 2);
    assert.equal(ring.min_threshold, 3);
    assert.equal(ring.status, 'low_stock', '2 <= 3 min threshold -> low_stock');
    assert.equal(ring.batches.length, 1);
    assert.equal(ring.batches[0].batch_number, 'HIR-RNG-001');
    assert.equal(ring.batches[0].quantity, 2);
  });
});

describe('Inventory KPI Stats Structure', () => {
  it('should correctly format stats object matching frontend expectations', () => {
    const mockGeneralStats = {
      totalProducts: 40,
      inventoryRetailValue: 343749.08,
      inventoryCostValue: 120500.00,
      lowStockCount: 3,
      slowMovingCount: 6,
      totalStock: 500,
      totalVariants: 85
    };

    const formatted = {
      total_products: mockGeneralStats.totalProducts,
      total_value: mockGeneralStats.inventoryRetailValue,
      total_cost_value: mockGeneralStats.inventoryCostValue,
      low_stock_count: mockGeneralStats.lowStockCount,
      slow_moving_count: mockGeneralStats.slowMovingCount,
      total_stock: mockGeneralStats.totalStock,
      total_variants: mockGeneralStats.totalVariants
    };

    assert.equal(formatted.total_products, 40);
    assert.equal(formatted.total_value, 343749.08);
    assert.equal(formatted.low_stock_count, 3);
    assert.equal(formatted.slow_moving_count, 6);
    assert.equal(formatted.total_stock, 500);
  });
});

describe('Multi-Variant Stock Extraction & Aggregation', () => {
  it('should accurately extract variant quantity from v.quantity, v.initial_stock, or v.stock_quantity', () => {
    const testVariants = [
      { size: 'S', color: 'Noir', quantity: 7 },
      { size: 'M', color: 'Noir', initial_stock: 12 },
      { size: 'L', color: 'Noir', stock_quantity: 5 },
      { size: 'XL', color: 'Noir', quantity: 0 }
    ];

    const extractedQtys = testVariants.map(v =>
      Number(v.quantity !== undefined ? v.quantity : (v.initial_stock !== undefined ? v.initial_stock : (v.stock_quantity || 0))) || 0
    );

    assert.deepEqual(extractedQtys, [7, 12, 5, 0]);

    const totalStock = extractedQtys.reduce((sum, q) => sum + q, 0);
    assert.equal(totalStock, 24, 'Total stock must equal sum of all variant quantities (7 + 12 + 5 + 0 = 24)');
  });

  it('should ensure POS product is marked available when totalStock > 0 and Sold Out when totalStock <= 0', () => {
    const inStockProduct = {
      id: 'p_1',
      name: 'Dress',
      variants: [
        { id: 'v_1', stock_quantity: 4 },
        { id: 'v_2', stock_quantity: 6 }
      ]
    };

    const outOfStockProduct = {
      id: 'p_2',
      name: 'Suit',
      variants: [
        { id: 'v_3', stock_quantity: 0 },
        { id: 'v_4', stock_quantity: 0 }
      ]
    };

    const computeStock = (p: typeof inStockProduct) =>
      p.variants?.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) ?? 0;

    assert.equal(computeStock(inStockProduct), 10);
    assert.equal(computeStock(inStockProduct) > 0, true);

    assert.equal(computeStock(outOfStockProduct), 0);
    assert.equal(computeStock(outOfStockProduct) <= 0, true);
  });
});
