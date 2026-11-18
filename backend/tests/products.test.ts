import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProductsService } from '../src/modules/products/products.service.js';
import { AuthUser } from '../src/middleware/authenticate.js';

class MockProductsRepository {
  public autocomplete(query: string, isCashier = false, limit = 8) {
    if (!query || !query.trim()) return [];
    if (query === 'XYZNonExistentLuxuryGarment2099') return [];
    return [
      {
        id: 'prod_silk_01',
        name: 'Ethiopian Silk Chiffon Dress',
        category_id: 'cat_clothing',
        category_name: 'Clothing & Apparel',
        subcategory_name: 'Dresses',
        selling_price: 4500,
        purchase_price: 2800,
        wholesale_price: 3500,
        total_stock: 14,
        is_simple: 0,
        status: 'active'
      }
    ];
  }

  public getVariantsForProductIds(ids: string[], isCashier = false) {
    return [
      {
        id: 'var_silk_s',
        product_id: 'prod_silk_01',
        size: 'S',
        color: 'Gold',
        selling_price: 4500,
        purchase_price: 2800,
        stock_quantity: 6
      }
    ];
  }
}

describe('Product Autocomplete Search & Fallback Logic', () => {
  const adminUser: AuthUser = {
    id: 'user_admin_01',
    username: 'admin',
    email: 'admin@hirbit.com',
    full_name: 'System Administrator',
    role: 'admin',
    permissions: []
  };

  const salesUser: AuthUser = {
    id: 'user_sales_01',
    username: 'sales',
    email: 'sales@hirbit.com',
    full_name: 'Sales Associate',
    role: 'sales',
    permissions: []
  };

  it('should return empty array when query is empty or whitespace only', () => {
    const service = new ProductsService(new MockProductsRepository() as any);
    const res1 = service.autocomplete(adminUser, '');
    const res2 = service.autocomplete(adminUser, '   ');
    assert.deepEqual(res1, []);
    assert.deepEqual(res2, []);
  });

  it('should return empty array for non-existent product titles ("not found" fallback state)', () => {
    const service = new ProductsService(new MockProductsRepository() as any);
    const res = service.autocomplete(adminUser, 'XYZNonExistentLuxuryGarment2099');
    assert.ok(Array.isArray(res));
    assert.equal(res.length, 0, 'Should return empty array when no matching products exist');
  });

  it('should return matching products for valid partial match queries', () => {
    const service = new ProductsService(new MockProductsRepository() as any);
    const res = service.autocomplete(adminUser, 'Silk');
    assert.ok(Array.isArray(res));
    assert.equal(res.length, 1);
    assert.ok(res[0].name.toLowerCase().includes('silk'));
    assert.ok(res[0].id);
    assert.ok(Array.isArray(res[0].variants));
    assert.equal(res[0].variants.length, 1);
  });

  it('should strip purchase_price and wholesale_price when role is sales', () => {
    const service = new ProductsService(new MockProductsRepository() as any);
    const res = service.autocomplete(salesUser, 'Silk');
    assert.equal(res.length, 1);
    assert.equal(res[0].purchase_price, undefined);
    assert.equal(res[0].wholesale_price, undefined);
    assert.equal(res[0].variants[0].purchase_price, undefined);
    assert.equal(res[0].selling_price, 4500);
  });
});
