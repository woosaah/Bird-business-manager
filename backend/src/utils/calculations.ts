// Calculation utilities for The Birds Business Manager

const GST_RATE = 0.15; // 15% GST for New Zealand

/**
 * Calculate GST amount from total (inc GST)
 */
export function calculateGST(totalIncGST: number): number {
  return parseFloat((totalIncGST - (totalIncGST / (1 + GST_RATE))).toFixed(2));
}

/**
 * Calculate total excluding GST
 */
export function calculateExGST(totalIncGST: number): number {
  return parseFloat((totalIncGST / (1 + GST_RATE)).toFixed(2));
}

/**
 * Add GST to amount
 */
export function addGST(amountExGST: number): number {
  return parseFloat((amountExGST * (1 + GST_RATE)).toFixed(2));
}

/**
 * Remove GST from amount
 */
export function removeGST(amountIncGST: number): number {
  return calculateExGST(amountIncGST);
}

/**
 * Calculate selling price from cost and margin
 * @param cost - Cost price (inc GST)
 * @param marginPercent - Profit margin percentage (e.g., 33.7 for 33.7%)
 */
export function calculateSellPrice(cost: number, marginPercent: number): number {
  const margin = marginPercent / 100;
  const sellPrice = cost / (1 - margin);
  return parseFloat(sellPrice.toFixed(2));
}

/**
 * Calculate profit from cost and sell price
 */
export function calculateProfit(cost: number, sellPrice: number): number {
  return parseFloat((sellPrice - cost).toFixed(2));
}

/**
 * Calculate profit margin percentage
 */
export function calculateMarginPercent(cost: number, sellPrice: number): number {
  if (sellPrice === 0) return 0;
  return parseFloat((((sellPrice - cost) / sellPrice) * 100).toFixed(2));
}

/**
 * Calculate price for weight-based products
 * @param weightKg - Weight in kilograms
 * @param pricePerKg - Price per kilogram
 * @param roundTo - Round to nearest value (default 0.50)
 */
export function calculateWeightPrice(
  weightKg: number,
  pricePerKg: number,
  roundTo: number = 0.5
): number {
  const price = weightKg * pricePerKg;
  const rounded = Math.round(price / roundTo) * roundTo;
  return parseFloat(rounded.toFixed(2));
}

/**
 * Calculator function for various operations
 */
export function calculate(operation: string, params: any): any {
  switch (operation) {
    case 'cost_to_price':
      if (!params.cost || !params.margin) {
        throw new Error('Cost and margin required');
      }
      return {
        sell_price: calculateSellPrice(params.cost, params.margin),
        profit: calculateProfit(params.cost, calculateSellPrice(params.cost, params.margin))
      };

    case 'weight_price':
      if (!params.weight || !params.price_per_kg) {
        throw new Error('Weight and price per kg required');
      }
      return {
        price: calculateWeightPrice(params.weight, params.price_per_kg, params.round_to || 0.5)
      };

    case 'gst_add':
      if (!params.amount) {
        throw new Error('Amount required');
      }
      return {
        amount_ex_gst: params.amount,
        gst_amount: parseFloat((params.amount * GST_RATE).toFixed(2)),
        amount_inc_gst: addGST(params.amount)
      };

    case 'gst_remove':
      if (!params.amount) {
        throw new Error('Amount required');
      }
      return {
        amount_inc_gst: params.amount,
        gst_amount: calculateGST(params.amount),
        amount_ex_gst: removeGST(params.amount)
      };

    case 'profit':
      if (!params.cost || !params.price) {
        throw new Error('Cost and price required');
      }
      return {
        profit: calculateProfit(params.cost, params.price),
        margin_percent: calculateMarginPercent(params.cost, params.price)
      };

    default:
      throw new Error('Invalid operation');
  }
}

/**
 * Round to common denominations (NZ currency)
 */
export function roundToCommon(amount: number): number {
  // Round to nearest $0.50
  return Math.round(amount * 2) / 2;
}
