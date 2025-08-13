// routes/newArrivalRoutes.js
import express from 'express';
import { getNewArrivals, updateNewArrivals } from '../controllers/newArrivalController.js';

const router = express.Router();

router.get('/', getNewArrivals);
router.put('/', updateNewArrivals); // secure this for admin only

export default router;
