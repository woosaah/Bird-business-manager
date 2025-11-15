import { Request, Response } from 'express';
import pool from '../config/database';
import { Product, CreateProductRequest } from '../types';
import { calculateSellPrice } from '../utils/calculations';

/**
 * Get all products
 */
export async function getAllProducts(req: Request, res: Response) {
  try {
    const { active_only } = req.query;

    let query = 'SELECT * FROM products';
    const params: any[] = [];

    if (active_only === 'true') {
      query += ' WHERE is_active = $1';
      params.push(true);
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
}

/**
 * Get product by ID
 */
export async function getProductById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
}

/**
 * Create a new product
 */
export async function createProduct(req: Request, res: Response) {
  try {
    const productData: CreateProductRequest = req.body;

    // Auto-calculate sell price if not provided
    let sellPrice = productData.sell_price;
    if (!sellPrice && productData.supplier_cost && productData.profit_margin) {
      sellPrice = calculateSellPrice(productData.supplier_cost, productData.profit_margin);
    }

    const result = await pool.query(
      `INSERT INTO products (
        name, supplier_cost, sell_price, stock_quantity, unit_type,
        pricing_type, price_per_kg, profit_margin, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        productData.name,
        productData.supplier_cost,
        sellPrice,
        productData.stock_quantity || 0,
        productData.unit_type,
        productData.pricing_type,
        productData.price_per_kg,
        productData.profit_margin || 33.7,
        productData.description
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    });
  }
}

/**
 * Update product
 */
export async function updateProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    values.push(id);
    const query = `
      UPDATE products
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    });
  }
}

/**
 * Delete (deactivate) product
 */
export async function deleteProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE products SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
}

/**
 * Update stock quantity
 */
export async function updateStock(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body; // operation: 'add' or 'set'

    let query: string;
    if (operation === 'add') {
      query = `
        UPDATE products
        SET stock_quantity = stock_quantity + $1
        WHERE id = $2
        RETURNING *
      `;
    } else {
      query = `
        UPDATE products
        SET stock_quantity = $1
        WHERE id = $2
        RETURNING *
      `;
    }

    const result = await pool.query(query, [quantity, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stock'
    });
  }
}

/**
 * Get low stock products
 */
export async function getLowStock(req: Request, res: Response) {
  try {
    const threshold = parseInt(req.query.threshold as string) || 10;

    const result = await pool.query(
      `SELECT * FROM products
       WHERE is_active = true AND stock_quantity <= $1
       ORDER BY stock_quantity ASC`,
      [threshold]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching low stock:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch low stock products'
    });
  }
}
