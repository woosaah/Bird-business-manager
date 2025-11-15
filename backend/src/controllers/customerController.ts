import { Request, Response } from 'express';
import pool from '../config/database';
import { Customer } from '../types';

/**
 * Get all customers
 */
export async function getAllCustomers(req: Request, res: Response) {
  try {
    const { active_only, type } = req.query;

    let query = 'SELECT * FROM customers';
    const params: any[] = [];
    const conditions: string[] = [];

    if (active_only === 'true') {
      conditions.push('is_active = true');
    }

    if (type) {
      params.push(type);
      conditions.push(`customer_type = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers'
    });
  }
}

/**
 * Get customer by ID with purchase history
 */
export async function getCustomerById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Get customer details
    const customerResult = await pool.query(
      'SELECT * FROM customers WHERE id = $1',
      [id]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Get purchase history
    const salesResult = await pool.query(
      `SELECT s.*, COUNT(si.id) as item_count
       FROM sales s
       LEFT JOIN sale_items si ON s.id = si.sale_id
       WHERE s.customer_id = $1
       GROUP BY s.id
       ORDER BY s.sale_date DESC
       LIMIT 50`,
      [id]
    );

    // Get total spent
    const statsResult = await pool.query(
      `SELECT
        COUNT(*) as total_purchases,
        COALESCE(SUM(total), 0) as total_spent,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END), 0) as total_paid
       FROM sales
       WHERE customer_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        customer: customerResult.rows[0],
        purchase_history: salesResult.rows,
        statistics: statsResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer'
    });
  }
}

/**
 * Create a new customer
 */
export async function createCustomer(req: Request, res: Response) {
  try {
    const { name, email, phone, address, customer_type, discount_amount, credit_limit, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO customers (
        name, email, phone, address, customer_type, discount_amount, credit_limit, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [name, email, phone, address, customer_type || 'retail', discount_amount, credit_limit || 0, notes]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customer'
    });
  }
}

/**
 * Update customer
 */
export async function updateCustomer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

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
      UPDATE customers
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update customer'
    });
  }
}

/**
 * Delete (deactivate) customer
 */
export async function deleteCustomer(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE customers SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete customer'
    });
  }
}

/**
 * Get customers with outstanding balances
 */
export async function getCustomersWithBalance(req: Request, res: Response) {
  try {
    const result = await pool.query(
      `SELECT * FROM customers
       WHERE balance_owing > 0 AND is_active = true
       ORDER BY balance_owing DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching customers with balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers with balance'
    });
  }
}

/**
 * Update customer balance
 */
export async function updateBalance(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { amount, operation } = req.body; // operation: 'add' or 'set'

    let query: string;
    if (operation === 'add') {
      query = `
        UPDATE customers
        SET balance_owing = balance_owing + $1
        WHERE id = $2
        RETURNING *
      `;
    } else {
      query = `
        UPDATE customers
        SET balance_owing = $1
        WHERE id = $2
        RETURNING *
      `;
    }

    const result = await pool.query(query, [amount, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update balance'
    });
  }
}
