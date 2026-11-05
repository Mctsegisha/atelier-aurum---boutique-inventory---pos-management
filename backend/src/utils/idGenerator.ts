import crypto from 'crypto';

/**
 * Generate a cryptographically secure, collision-resistant ID.
 */
export function generateId(prefix: string): string {
  const entropy = crypto.randomBytes(6).toString('hex');
  return `${prefix}_${Date.now()}_${entropy}`;
}

/**
 * Generate store receipt numbers: HIR-YYYY-HEX (Hirbit Store)
 */
export function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `HIR-${year}-${hex}`;
}

/**
 * Generate unique purchase order numbers: PO-YYYY-HEX
 */
export function generatePoNumber(): string {
  const year = new Date().getFullYear();
  const hex = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `PO-${year}-${hex}`;
}

