import express from 'express';
import { performCalculation, getWeightPrices } from '../controllers/calculatorController';

const router = express.Router();

router.post('/', performCalculation);
router.get('/weight-prices', getWeightPrices);

export default router;
