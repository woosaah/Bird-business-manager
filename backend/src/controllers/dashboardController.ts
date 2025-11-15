import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(req: Request, res: Response) {
  try {
    // Today's sales
    const todaySales = await pool.query(
      `SELECT COALESCE(SUM(total), 0) as total
       FROM sales
       WHERE DATE(sale_date) = CURRENT_DATE`
    );

    // This week's sales
    const weekSales = await pool.query(
      `SELECT COALESCE(SUM(total), 0) as total
       FROM sales
       WHERE sale_date >= DATE_TRUNC('week', CURRENT_DATE)`
    );

    // This month's sales
    const monthSales = await pool.query(
      `SELECT COALESCE(SUM(total), 0) as total
       FROM sales
       WHERE sale_date >= DATE_TRUNC('month', CURRENT_DATE)`
    );

    // Total owing
    const totalOwing = await pool.query(
      'SELECT COALESCE(SUM(balance_owing), 0) as total FROM customers'
    );

    // Low stock count
    const lowStock = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE is_active = true AND stock_quantity <= 10'
    );

    // Pending Xero sync
    const pendingSync = await pool.query(
      `SELECT COUNT(*) as count FROM xero_sync_log WHERE status = 'pending'`
    );

    // Recent sales
    const recentSales = await pool.query(
      `SELECT s.*, c.name as customer_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       ORDER BY s.sale_date DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        today_sales: parseFloat(todaySales.rows[0].total),
        week_sales: parseFloat(weekSales.rows[0].total),
        month_sales: parseFloat(monthSales.rows[0].total),
        total_owing: parseFloat(totalOwing.rows[0].total),
        low_stock_count: parseInt(lowStock.rows[0].count),
        pending_xero_sync: parseInt(pendingSync.rows[0].count),
        recent_sales: recentSales.rows
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
}

/**
 * Get sales trends
 */
export async function getSalesTrends(req: Request, res: Response) {
  try {
    const { period } = req.query; // 'daily', 'weekly', 'monthly'

    let groupBy: string;
    let dateFormat: string;

    switch (period) {
      case 'weekly':
        groupBy = "DATE_TRUNC('week', sale_date)";
        dateFormat = 'YYYY-"W"IW';
        break;
      case 'monthly':
        groupBy = "DATE_TRUNC('month', sale_date)";
        dateFormat = 'YYYY-MM';
        break;
      default: // daily
        groupBy = 'DATE(sale_date)';
        dateFormat = 'YYYY-MM-DD';
    }

    const result = await pool.query(
      `SELECT
        TO_CHAR(${groupBy}, '${dateFormat}') as period,
        COUNT(*) as sale_count,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(SUM(subtotal), 0) as total_ex_gst,
        COALESCE(AVG(total), 0) as average_sale
       FROM sales
       WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY ${groupBy}
       ORDER BY ${groupBy} ASC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching sales trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales trends'
    });
  }
}

/**
 * Get top selling products
 */
export async function getTopProducts(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await pool.query(
      `SELECT
        p.id,
        p.name,
        p.unit_type,
        p.pricing_type,
        COUNT(si.id) as times_sold,
        COALESCE(SUM(si.quantity), 0) as total_quantity,
        COALESCE(SUM(si.weight_kg), 0) as total_weight,
        COALESCE(SUM(si.line_total), 0) as total_revenue
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       GROUP BY p.id, p.name, p.unit_type, p.pricing_type
       ORDER BY total_revenue DESC
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top products'
    });
  }
}

/**
 * Get customer analytics
 */
export async function getCustomerAnalytics(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // Top customers by revenue
    const topCustomers = await pool.query(
      `SELECT
        c.id,
        c.name,
        c.customer_type,
        COUNT(s.id) as purchase_count,
        COALESCE(SUM(s.total), 0) as total_spent,
        MAX(s.sale_date) as last_purchase
       FROM customers c
       JOIN sales s ON c.id = s.customer_id
       GROUP BY c.id, c.name, c.customer_type
       ORDER BY total_spent DESC
       LIMIT $1`,
      [limit]
    );

    // Customer type breakdown
    const typeBreakdown = await pool.query(
      `SELECT
        customer_type,
        COUNT(*) as count,
        COALESCE(SUM(balance_owing), 0) as total_owing
       FROM customers
       WHERE is_active = true
       GROUP BY customer_type`
    );

    res.json({
      success: true,
      data: {
        top_customers: topCustomers.rows,
        type_breakdown: typeBreakdown.rows
      }
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer analytics'
    });
  }
}

/**
 * Get inventory summary
 */
export async function getInventorySummary(req: Request, res: Response) {
  try {
    const summary = await pool.query(
      `SELECT
        COUNT(*) as total_products,
        COUNT(CASE WHEN is_active THEN 1 END) as active_products,
        COUNT(CASE WHEN stock_quantity <= 10 THEN 1 END) as low_stock,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock,
        COALESCE(SUM(stock_quantity * supplier_cost), 0) as total_value
       FROM products`
    );

    const byType = await pool.query(
      `SELECT
        unit_type,
        COUNT(*) as count,
        COALESCE(SUM(stock_quantity), 0) as total_stock
       FROM products
       WHERE is_active = true
       GROUP BY unit_type`
    );

    res.json({
      success: true,
      data: {
        summary: summary.rows[0],
        by_type: byType.rows
      }
    });
  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory summary'
    });
  }
}
