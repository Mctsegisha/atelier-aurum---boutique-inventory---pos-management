/**
 * Centralized Ethiopian Birr (ETB) Currency Formatting
 * Standardizes financial displays across Hirbit Store inventory, POS checkout, and reports.
 */

export const DEFAULT_CURRENCY = 'ETB';
export const DEFAULT_CURRENCY_SYMBOL = 'ETB';

/**
 * Formats a monetary value to Ethiopian Birr (e.g. "1,500.00 ETB" or "ETB 1,500.00").
 * @param val - The amount (number or numeric string)
 * @param prefix - If true, outputs "ETB 1,500.00", otherwise "1,500.00 ETB" (default: false)
 */
export function formatCurrency(
  val: number | string | null | undefined,
  prefix = false
): string {
  if (val === null || val === undefined || val === '') return '—';
  const num = Number(val);
  if (isNaN(num)) return '—';

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  return prefix ? `ETB ${formatted}` : `${formatted} ETB`;
}

/**
 * Alias for formatCurrency with default suffix format.
 */
export function formatBirr(val: number | string | null | undefined): string {
  return formatCurrency(val, false);
}

