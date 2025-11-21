import express from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import customerRoutes from './customerRoutes';
import salesRoutes from './salesRoutes';
import calculatorRoutes from './calculatorRoutes';
import dashboardRoutes from './dashboardRoutes';
import { optionalAuth } from '../middleware/auth';

const router = express.Router();

// Health check (public)
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes (public + protected)
router.use('/auth', authRoutes);

// Apply optional authentication to all other routes
// This allows routes to work without auth, but adds user info if authenticated
router.use(optionalAuth);

// Mount business routes
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/sales', salesRoutes);
router.use('/calculator', calculatorRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
