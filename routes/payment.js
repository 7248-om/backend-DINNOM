// routes/payment.js
import express from 'express';
import { razorpay } from '../utils/razorpay.js';
import crypto from 'crypto';
import Order from '../models/order.js';

const router = express.Router();

// ✅ Create Razorpay order
router.post('/create-order', async (req, res) => {
  const { amount } = req.body;

  console.log('🔥 Incoming /create-order request');
  console.log('➡️ Received amount from frontend:', amount);
  if (!amount || isNaN(amount)) {
    console.warn('⚠️ Amount is missing or invalid');
  }

  const options = {
    amount: amount * 100, // in paise
    currency: 'INR',
    receipt: `receipt_order_${Date.now()}`,
  };

  console.log('📦 Sending options to Razorpay:', options);

  try {
    const order = await razorpay.orders.create(options);
    console.log('✅ Razorpay order created:', order);
    res.status(200).json(order);
  } catch (err) {
    console.error('❌ Razorpay create error:', err);
    res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
  }
});

// ✅ Verify and save paid order
router.post('/verify', async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userId,
    items,
    shippingAddress,
    totalAmount,
  } = req.body;

  console.log('🧾 Verifying payment with data:', {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    totalAmount,
  });

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  const isValid = expectedSignature === razorpay_signature;
  console.log('🔐 Signature valid?', isValid);

  if (!isValid) {
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }

  try {
    const newOrder = new Order({
      userId,
      items,
      shippingAddress,
      totalAmount,
      status: 'Processing',
    });

    await newOrder.save();

    console.log('📥 Order saved to DB:', newOrder);
    res.status(200).json({ success: true, message: 'Payment verified and order saved' });
  } catch (err) {
    console.error('❌ Order save error:', err);
    res.status(500).json({ success: false, message: 'Failed to save order' });
  }
});

export default router;
