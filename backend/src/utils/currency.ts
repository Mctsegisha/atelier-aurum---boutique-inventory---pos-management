/**
 * Integer Subunit (Cents / Santim) currency utilities to prevent binary floating-point drift.
 * Standardized for Ethiopian Birr (ETB).
 */
export const DEFAULT_CURRENCY = 'ETB';
export const DEFAULT_CURRENCY_SYMBOL = 'ETB';

export function toCents(amount: number): number {
  return Math.round(Number(amount || 0) * 100);
}

export function toBirr(cents: number): number {
  return Math.round(Number(cents || 0)) / 100;
}

// Backward compatibility alias for existing modules
export const toDollars = toBirr;

export function formatCurrency(cents: number, symbol = 'ETB'): string {
  return `${(cents / 100).toFixed(2)} ${symbol}`.trim();
}


