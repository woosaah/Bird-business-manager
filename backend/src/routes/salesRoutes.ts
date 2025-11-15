import express from 'express';
import {
  createSale,
  getAllSales,
  getSaleById,
  addPayment,
  getSalesStats
} from '../controllers/salesController';

const router = express.Router();

router.get('/', getAllSales);
router.get('/stats', getSalesStats);
router.get('/:id', getSaleById);
router.post('/', createSale);
router.post('/:id/payments', addPayment);

export default router;
