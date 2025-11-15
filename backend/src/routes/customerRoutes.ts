import express from 'express';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomersWithBalance,
  updateBalance
} from '../controllers/customerController';

const router = express.Router();

router.get('/', getAllCustomers);
router.get('/with-balance', getCustomersWithBalance);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.patch('/:id/balance', updateBalance);
router.delete('/:id', deleteCustomer);

export default router;
