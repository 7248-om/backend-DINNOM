import express from 'express';
import { getAuthParams } from '../controllers/imagekitController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// This endpoint should be protected to ensure only authenticated users can get upload tokens.
// If you have an admin middleware, you could add it here too: protect, admin
router.get('/auth', protect, getAuthParams);

export default router;

