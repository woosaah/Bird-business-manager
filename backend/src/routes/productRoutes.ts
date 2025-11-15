import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStock
} from '../controllers/productController';

const router = express.Router();

router.get('/', getAllProducts);
router.get('/low-stock', getLowStock);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.patch('/:id/stock', updateStock);
router.delete('/:id', deleteProduct);

export default router;
