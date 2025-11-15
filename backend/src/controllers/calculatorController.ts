import { Request, Response } from 'express';
import { calculate } from '../utils/calculations';
import { getCommonWeightPrices } from '../utils/helpers';

/**
 * Calculator endpoint for various price calculations
 */
export async function performCalculation(req: Request, res: Response) {
  try {
    const { operation, ...params } = req.body;

    if (!operation) {
      return res.status(400).json({
        success: false,
        error: 'Operation required'
      });
    }

    const result = calculate(operation, params);

    res.json({
      success: true,
      operation,
      input: params,
      result
    });
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Calculation failed'
    });
  }
}

/**
 * Get common weight portions with prices
 */
export async function getWeightPrices(req: Request, res: Response) {
  try {
    const { price_per_kg } = req.query;

    if (!price_per_kg) {
      return res.status(400).json({
        success: false,
        error: 'price_per_kg required'
      });
    }

    const pricePerKg = parseFloat(price_per_kg as string);
    const prices = getCommonWeightPrices(pricePerKg);

    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    console.error('Error calculating weight prices:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to calculate weight prices'
    });
  }
}
