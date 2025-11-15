import express from 'express';
import {
  getDashboardStats,
  getSalesTrends,
  getTopProducts,
  getCustomerAnalytics,
  getInventorySummary
} from '../controllers/dashboardController';

const router = express.Router();

router.get('/stats', getDashboardStats);
router.get('/trends', getSalesTrends);
router.get('/top-products', getTopProducts);
router.get('/customer-analytics', getCustomerAnalytics);
router.get('/inventory', getInventorySummary);

export default router;
