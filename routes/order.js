import express from 'express';
import {
  createOrder,
  getMyOrders,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// User-specific routes
router.route('/').post(createOrder);
router.route('/myorders').get(getMyOrders);
router.route('/:id/cancel').put(cancelOrder);

// Admin-specific routes
router.route('/all').get(admin, getAllOrders);
router.route('/stats').get(admin, getOrderStats);
router.route('/:id/status').put(admin, updateOrderStatus);
router.route('/:id').delete(admin, deleteOrder);

export default router;
