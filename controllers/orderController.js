import Order from '../models/order.js';
import Cart from '../models/cart.js';

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    if (!shippingAddress || !shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
      return res.status(400).json({ message: 'Shipping address is required and must be complete' });
    }

    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cannot create order from an empty cart' });
    }

    const orderItems = cart.items.map(item => {
      if (!item.productId) {
        // This can happen if a product is deleted while in a user's cart.
        throw new Error(`Product with ID ${item.productId} not found.`);
      }
      return {
        productId: item.productId._id,
        name: item.productId.name,
        quantity: item.quantity,
        price: item.productId.price,
        image: item.productId.mainImage, // Correctly use mainImage from product model
        selectedSize: item.selectedSize,
      };
    });

    const totalAmount = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const order = new Order({
      userId: req.user._id,
      items: orderItems,
      shippingAddress,
      totalAmount,
      status: 'Processing', // As requested
    });

    const createdOrder = await order.save();

    // Clear the cart after order is created
    cart.items = [];
    await cart.save();

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error while creating order.' });
  }
};

/**
 * @desc    Get logged in user orders
 * @route   GET /api/orders/myorders
 * @access  Private
 */
export const getMyOrders = async (req, res) => {
  try {
    // Find orders for the logged in user and sort by most recent
    const orders = await Order.find({ userId: req.user._id }).sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

/**
 * @desc    Cancel an order by user
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Ensure the user owns the order
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to cancel this order' });
    }

    if (order.status === 'Shipped' || order.status === 'Delivered') {
        return res.status(400).json({ message: 'Cannot cancel an order that has already been shipped or delivered.' });
    }

    order.status = 'Cancelled';
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server error while cancelling order' });
  }
};

/**
 * @desc    Get all orders (admin)
 * @route   GET /api/orders/all
 * @access  Private/Admin
 */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('userId', 'id displayName email')
      .sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Failed to fetch all orders' });
  }
};

/**
 * @desc    Update order status (admin)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const order = await Order.findById(req.params.id);

    if (order) {
      order.status = status;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error)
 { console.error('Error updating order status:', error);
 res.status(500).json({ message: 'Server error while updating order status' });
  }
};

/**
 * @desc    Delete an order (admin)
 * @route   DELETE /api/orders/:id
 * @access  Private/Admin
 */
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      await order.deleteOne();
      res.json({ message: 'Order removed' });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Server error while deleting order' });
  }
};

/**
 * @desc    Get order statistics (admin)
 * @route   GET /api/orders/stats
 * @access  Private/Admin
 */
export const getOrderStats = async (req, res) => {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Get daily stats for charts
    const dailyStats = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: threeMonthsAgo },
          status: { $in: ['Processing', 'Shipped', 'Delivered'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } },
          totalSales: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalSales: 1,
          totalOrders: 1,
        },
      },
    ]);

    // Get overall summary for display cards
    const summary = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: threeMonthsAgo },
          status: { $in: ['Processing', 'Shipped', 'Delivered'] },
        },
      },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalOrders: { $sum: 1 } } },
      { $project: { _id: 0, totalRevenue: 1, totalOrders: 1 } },
    ]);

    // NEW: Category stats aggregation
    const categoryStats = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: threeMonthsAgo },
          status: { $in: ['Processing', 'Shipped', 'Delivered'] },
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products', // Assumes your products collection is named 'products'
          localField: 'items.productId',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.category',
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          totalItemsSold: { $sum: '$items.quantity' },
        },
      },
      {
        $project: { _id: 0, category: '$_id', totalRevenue: 1, totalItemsSold: 1 },
      },
    ]);

    res.json({ dailyStats, summary: summary[0] || { totalRevenue: 0, totalOrders: 0 }, categoryStats });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Server error while fetching order stats' });
  }
};
