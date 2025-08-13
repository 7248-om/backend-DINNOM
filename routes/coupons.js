import express from 'express';
import Coupon from '../models/Coupon.js';

const router = express.Router();

// Admin: Create a new coupon
router.post('/admin/create', async (req, res) => {
  try {
    const { code, discountType, discountValue, minCartAmount, expiresAt } = req.body;

    if (!code || !discountType || !discountValue || !expiresAt) {
      return res.status(400).json({ error: 'All required fields must be filled.' });
    }

    const existing = await Coupon.findOne({ code });
    if (existing) return res.status(400).json({ error: 'Coupon code already exists.' });

    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minCartAmount: minCartAmount || 0,
      expiresAt,
    });

    await newCoupon.save();
    res.status(201).json(newCoupon);
  } catch (err) {
    console.error('Coupon creation error:', err);
    res.status(500).json({ error: 'Server error while creating coupon.' });
  }
});

// User: Get all active (non-expired) coupons
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({ expiresAt: { $gt: now } }).sort({ expiresAt: 1 });
    res.json(coupons);
  } catch (err) {
    console.error('Fetch coupons error:', err);
    res.status(500).json({ error: 'Failed to fetch coupons.' });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const updatedCoupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updatedCoupon);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});


// Admin: Delete a coupon
router.delete('/:id', async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});
// Admin: Get all coupons (including expired)
router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupons.' });
  }
});


// User: Validate coupon code
router.post('/validate', async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code || cartTotal == null)
      return res.status(400).json({ error: 'Coupon code and cart total are required.' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });

    if (new Date(coupon.expiresAt) < new Date())
      return res.status(400).json({ error: 'Coupon has expired.' });

    if (cartTotal < coupon.minCartAmount)
      return res.status(400).json({
        error: `Cart total must be at least ₹${coupon.minCartAmount} to use this coupon.`,
      });

    res.json({ valid: true, coupon });
  } catch (err) {
    console.error('Coupon validation error:', err);
    res.status(500).json({ error: 'Server error while validating coupon.' });
  }
});

export default router;
