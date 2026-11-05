import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toCents, toDollars, formatCurrency } from '../src/utils/currency.js';
import { generateId, generateReceiptNumber } from '../src/utils/idGenerator.js';

describe('Financial Integer Cents Arithmetic & Currency Formatting', () => {
  it('should accurately convert floating dollar values to integer cents without precision drift', () => {
    assert.equal(toCents(145.50), 14550);
    assert.equal(toCents(0.1 + 0.2), 30); // 0.30000000000000004 -> 30 cents
    assert.equal(toCents(1299.99), 129999);
  });

  it('should convert cents back to decimal currency values', () => {
    assert.equal(toDollars(14550), 145.5);
    assert.equal(toDollars(30), 0.3);
  });

  it('should format cents into price strings with ETB currency', () => {
    assert.equal(formatCurrency(14550), '145.50 ETB');
    assert.equal(formatCurrency(30), '0.30 ETB');
    assert.equal(formatCurrency(129900, 'Birr'), '1299.00 Birr');
  });
});

describe('ID Generation & Collision Resistance', () => {
  it('should generate collision-resistant IDs with specified prefix', () => {
    const id1 = generateId('sale');
    const id2 = generateId('sale');
    assert.ok(id1.startsWith('sale_'));
    assert.ok(id2.startsWith('sale_'));
    assert.notEqual(id1, id2, 'Two generated IDs must be unique');
  });

  it('should generate structured receipt numbers with HIR-YYYY- prefix', () => {
    const receipt = generateReceiptNumber();
    const currentYear = new Date().getFullYear();
    assert.ok(receipt.startsWith(`HIR-${currentYear}-`), `Receipt must start with HIR-${currentYear}-`);
  });
});

