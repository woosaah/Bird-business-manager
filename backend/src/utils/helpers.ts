import pool from '../config/database';

/**
 * Generate the next invoice number
 * Format: FTB-NNNNNN (e.g., FTB-000001)
 */
export async function generateInvoiceNumber(): Promise<string> {
  const result = await pool.query(
    'SELECT invoice_number FROM sales ORDER BY id DESC LIMIT 1'
  );

  if (result.rows.length === 0) {
    return 'FTB-000001';
  }

  const lastInvoice = result.rows[0].invoice_number;
  const lastNumber = parseInt(lastInvoice.split('-')[1]);
  const nextNumber = lastNumber + 1;

  return `FTB-${nextNumber.toString().padStart(6, '0')}`;
}

/**
 * Format currency for display (NZ dollars)
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('en-NZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Convert grams to kilograms
 */
export function gramsToKg(grams: number): number {
  return grams / 1000;
}

/**
 * Convert kilograms to grams
 */
export function kgToGrams(kg: number): number {
  return kg * 1000;
}

/**
 * Common weight portions in kg
 */
export const COMMON_WEIGHTS = {
  '125g': 0.125,
  '200g': 0.200,
  '250g': 0.250,
  '500g': 0.500,
  '1kg': 1.000
};

/**
 * Get common weight portions with calculated prices
 */
export function getCommonWeightPrices(pricePerKg: number): Record<string, number> {
  const prices: Record<string, number> = {};

  for (const [label, kg] of Object.entries(COMMON_WEIGHTS)) {
    prices[label] = parseFloat((kg * pricePerKg).toFixed(2));
  }

  return prices;
}

/**
 * Parse weight input (supports "125g", "0.125kg", "125", etc.)
 */
export function parseWeightInput(input: string): number {
  const cleaned = input.trim().toLowerCase();

  if (cleaned.endsWith('kg')) {
    return parseFloat(cleaned.replace('kg', ''));
  }

  if (cleaned.endsWith('g')) {
    return gramsToKg(parseFloat(cleaned.replace('g', '')));
  }

  // Assume kg if no unit
  return parseFloat(cleaned);
}
