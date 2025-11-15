import { Request, Response } from 'express';
import pool from '../config/database';
import { CreateSaleRequest, SaleItemRequest } from '../types';
import { generateInvoiceNumber } from '../utils/helpers';
import { calculateGST, calculateExGST } from '../utils/calculations';

/**
 * Create a new sale
 */
export async function createSale(req: Request, res: Response) {
  const client = await pool.connect();

  try {
    const saleData: CreateSaleRequest = req.body;

    await client.query('BEGIN');

    // Calculate totals
    let totalAmount = 0;
    const saleItems: any[] = [];

    for (const item of saleData.items) {
      // Get product details
      const productResult = await client.query(
        'SELECT * FROM products WHERE id = $1',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      const product = productResult.rows[0];

      // Calculate line total
      let lineTotal: number;
      let unitPrice: number;
      let quantity: number | null = null;
      let weightKg: number | null = null;

      if (product.pricing_type === 'per_kg') {
        // Weight-based pricing
        if (!item.weight_kg) {
          throw new Error(`Weight required for product: ${product.name}`);
        }
        weightKg = item.weight_kg;
        unitPrice = item.unit_price || product.price_per_kg;
        lineTotal = weightKg * unitPrice;
      } else {
        // Unit-based pricing
        if (!item.quantity) {
          throw new Error(`Quantity required for product: ${product.name}`);
        }
        quantity = item.quantity;
        unitPrice = item.unit_price || product.sell_price;
        lineTotal = quantity * unitPrice;
      }

      // Apply customer discount if applicable
      if (saleData.customer_id) {
        const customerResult = await client.query(
          'SELECT discount_amount FROM customers WHERE id = $1',
          [saleData.customer_id]
        );

        if (customerResult.rows.length > 0 && customerResult.rows[0].discount_amount) {
          const discountPerItem = customerResult.rows[0].discount_amount;
          const itemCount = quantity || 1;
          lineTotal -= (discountPerItem * itemCount);
        }
      }

      totalAmount += lineTotal;

      saleItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity,
        weight_kg: weightKg,
        unit_price: unitPrice,
        line_total: parseFloat(lineTotal.toFixed(2))
      });

      // Update stock
      if (product.pricing_type === 'per_kg') {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [weightKg, product.id]
        );
      } else {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [quantity, product.id]
        );
      }
    }

    // Calculate GST
    const total = parseFloat(totalAmount.toFixed(2));
    const subtotal = calculateExGST(total);
    const gstAmount = calculateGST(total);

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Determine payment status
    let paymentStatus = 'owing';
    if (saleData.payment_amount) {
      if (saleData.payment_amount >= total) {
        paymentStatus = 'paid';
      } else {
        paymentStatus = 'partial';
      }
    }

    // Create sale record
    const saleResult = await client.query(
      `INSERT INTO sales (
        customer_id, subtotal, gst_amount, total, payment_status, invoice_number, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [saleData.customer_id, subtotal, gstAmount, total, paymentStatus, invoiceNumber, saleData.notes]
    );

    const sale = saleResult.rows[0];

    // Create sale items
    for (const item of saleItems) {
      await client.query(
        `INSERT INTO sale_items (
          sale_id, product_id, product_name, quantity, weight_kg, unit_price, line_total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sale.id, item.product_id, item.product_name, item.quantity, item.weight_kg, item.unit_price, item.line_total]
      );
    }

    // Record payment if provided
    if (saleData.payment_amount && saleData.payment_amount > 0) {
      await client.query(
        `INSERT INTO payments (sale_id, amount, payment_method)
         VALUES ($1, $2, $3)`,
        [sale.id, saleData.payment_amount, saleData.payment_method || 'cash']
      );
    }

    // Update customer balance if not fully paid
    if (saleData.customer_id && paymentStatus !== 'paid') {
      const owing = total - (saleData.payment_amount || 0);
      await client.query(
        'UPDATE customers SET balance_owing = balance_owing + $1 WHERE id = $2',
        [owing, saleData.customer_id]
      );
    }

    await client.query('COMMIT');

    // Fetch complete sale with items
    const completeSale = await getSaleWithItems(sale.id);

    res.status(201).json({
      success: true,
      data: completeSale
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating sale:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create sale'
    });
  } finally {
    client.release();
  }
}

/**
 * Get sale with items helper function
 */
async function getSaleWithItems(saleId: number) {
  const saleResult = await pool.query(
    `SELECT s.*, c.name as customer_name, c.email as customer_email
     FROM sales s
     LEFT JOIN customers c ON s.customer_id = c.id
     WHERE s.id = $1`,
    [saleId]
  );

  const itemsResult = await pool.query(
    'SELECT * FROM sale_items WHERE sale_id = $1',
    [saleId]
  );

  const paymentsResult = await pool.query(
    'SELECT * FROM payments WHERE sale_id = $1',
    [saleId]
  );

  return {
    ...saleResult.rows[0],
    items: itemsResult.rows,
    payments: paymentsResult.rows
  };
}

/**
 * Get all sales
 */
export async function getAllSales(req: Request, res: Response) {
  try {
    const { customer_id, status, start_date, end_date, limit } = req.query;

    let query = `
      SELECT s.*, c.name as customer_name,
        (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as item_count
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (customer_id) {
      params.push(customer_id);
      query += ` AND s.customer_id = $${paramCount}`;
      paramCount++;
    }

    if (status) {
      params.push(status);
      query += ` AND s.payment_status = $${paramCount}`;
      paramCount++;
    }

    if (start_date) {
      params.push(start_date);
      query += ` AND s.sale_date >= $${paramCount}`;
      paramCount++;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND s.sale_date <= $${paramCount}`;
      paramCount++;
    }

    query += ' ORDER BY s.sale_date DESC';

    if (limit) {
      params.push(limit);
      query += ` LIMIT $${paramCount}`;
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales'
    });
  }
}

/**
 * Get sale by ID
 */
export async function getSaleById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const sale = await getSaleWithItems(parseInt(id));

    if (!sale.id) {
      return res.status(404).json({
        success: false,
        error: 'Sale not found'
      });
    }

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sale'
    });
  }
}

/**
 * Add payment to sale
 */
export async function addPayment(req: Request, res: Response) {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { amount, payment_method, notes } = req.body;

    await client.query('BEGIN');

    // Get sale
    const saleResult = await client.query(
      'SELECT * FROM sales WHERE id = $1',
      [id]
    );

    if (saleResult.rows.length === 0) {
      throw new Error('Sale not found');
    }

    const sale = saleResult.rows[0];

    // Add payment
    await client.query(
      `INSERT INTO payments (sale_id, amount, payment_method, notes)
       VALUES ($1, $2, $3, $4)`,
      [id, amount, payment_method, notes]
    );

    // Calculate total paid
    const paymentsResult = await client.query(
      'SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE sale_id = $1',
      [id]
    );

    const totalPaid = parseFloat(paymentsResult.rows[0].total_paid);

    // Update payment status
    let newStatus = 'owing';
    if (totalPaid >= sale.total) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partial';
    }

    await client.query(
      'UPDATE sales SET payment_status = $1 WHERE id = $2',
      [newStatus, id]
    );

    // Update customer balance
    if (sale.customer_id) {
      await client.query(
        'UPDATE customers SET balance_owing = balance_owing - $1 WHERE id = $2',
        [amount, sale.customer_id]
      );
    }

    await client.query('COMMIT');

    const updatedSale = await getSaleWithItems(parseInt(id));

    res.json({
      success: true,
      data: updatedSale
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding payment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add payment'
    });
  } finally {
    client.release();
  }
}

/**
 * Get sales statistics
 */
export async function getSalesStats(req: Request, res: Response) {
  try {
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params: any[] = [];

    if (start_date && end_date) {
      params.push(start_date, end_date);
      dateFilter = 'WHERE sale_date >= $1 AND sale_date <= $2';
    }

    const result = await pool.query(
      `SELECT
        COUNT(*) as total_sales,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(SUM(subtotal), 0) as total_ex_gst,
        COALESCE(SUM(gst_amount), 0) as total_gst,
        COALESCE(AVG(total), 0) as average_sale
       FROM sales
       ${dateFilter}`,
      params
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching sales stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales statistics'
    });
  }
}
