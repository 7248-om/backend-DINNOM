import express from 'express';
import {
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getUserAddresses).post(addAddress);

router.route('/:id').put(updateAddress).delete(deleteAddress);

router.route('/:id/default').put(setDefaultAddress);

export default router;