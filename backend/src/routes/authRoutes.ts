import express from 'express';
import {
  login,
  logout,
  register,
  getCurrentUser,
  getAllUsers,
  updateUser,
  deleteUser
} from '../controllers/authController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes (require authentication)
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', authenticateToken, logout);

// Admin only routes
router.post('/register', authenticateToken, requireAdmin, register);
router.get('/users', authenticateToken, requireAdmin, getAllUsers);
router.put('/users/:id', authenticateToken, requireAdmin, updateUser);
router.delete('/users/:id', authenticateToken, requireAdmin, deleteUser);

export default router;
