import Cart from '../models/cart.js';

export const addToCart = async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity, selectedSize } = req.body;

  if (!productId || !selectedSize || !quantity || quantity < 1) {
    return res.status(400).json({ message: 'Invalid product, size, or quantity' });
  }

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Find item by both productId and selectedSize
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.equals(productId) && item.selectedSize === selectedSize
    );

    if (itemIndex > -1) {
      // Update quantity if item with the same size already exists
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Add new item with size
      cart.items.push({ productId, quantity, selectedSize });
    }

    await cart.save();
    const populatedCart = await cart.populate('items.productId');
    res.status(200).json(populatedCart);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Server error while adding to cart.' });
  }
};

export const getCart = async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
  if (!cart) return res.status(200).json({ items: [] });
  res.status(200).json(cart);
};

export const removeFromCart = async (req, res) => {
  const { itemId } = req.params; // It's better to remove by the unique item ID
  const cart = await Cart.findOne({ userId: req.user._id });

  if (!cart) return res.status(404).json({ message: 'Cart not found' });

  // Remove a specific cart item by its own _id, not all items with a productId
  cart.items = cart.items.filter(item => !item._id.equals(itemId));
  await cart.save();

  const populatedCart = await cart.populate('items.productId');
  res.status(200).json(populatedCart);
};

export const clearCart = async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id });

  if (cart) {
    cart.items = [];
    await cart.save();
  }

  res.status(200).json({ message: 'Cart cleared' });
};
