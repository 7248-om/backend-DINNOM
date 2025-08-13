// routes/cart.js
import express from 'express';
import Cart from '../models/cart.js';
import Product from '../models/product.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ADD or UPDATE quantity (supports absolute updates)
router.post('/', protect, async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity, selectedSize, absolute = false } = req.body;

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = new Cart({ userId, items: [] });
  }

  const existingItemIndex = cart.items.findIndex(
    item =>
      item.productId.equals(productId) &&
      item.selectedSize === selectedSize
  );

  if (existingItemIndex !== -1) {
    if (absolute) {
      cart.items[existingItemIndex].quantity = quantity;
    } else {
      cart.items[existingItemIndex].quantity += quantity;
    }
  } else {
    cart.items.push({ productId, quantity, selectedSize });
  }

  await cart.save();
  res.status(200).json({ message: 'Cart updated', cart });
});

// FETCH cart
router.get('/', protect, async (req, res) => {
  const userId = req.user._id;

  try {
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    res.status(200).json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
});

// REMOVE item
router.delete('/remove', protect, async (req, res) => {
  const { productId, selectedSize } = req.body;
  const userId = req.user._id;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(
      (item) =>
        !(item.productId.equals(productId) && item.selectedSize === selectedSize)
    );

    await cart.save();
    res.status(200).json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove item' });
  }
});

export default router;
