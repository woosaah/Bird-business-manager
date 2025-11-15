import express from 'express';
import productRoutes from './productRoutes';
import customerRoutes from './customerRoutes';
import salesRoutes from './salesRoutes';
import calculatorRoutes from './calculatorRoutes';
import dashboardRoutes from './dashboardRoutes';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount routes
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/sales', salesRoutes);
router.use('/calculator', calculatorRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
