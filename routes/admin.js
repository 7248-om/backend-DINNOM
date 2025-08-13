import express from 'express';
import {
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} from '../controllers/adminController.js';

// Optional middleware to protect admin routes
// import { isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all orders
router.get('/orders', /*isAdmin */ getAllOrders);
router.delete('/orders/:id', deleteOrder);

// UPDATE order status
router.put('/orders/:id/status', /*isAdmin,*/  updateOrderStatus);

export default router;
