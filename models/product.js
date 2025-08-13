import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // Unique name of the product
  name: {
    type: String,
    required: true,
    trim: true,
  },
  // Unique ID
  productId: {
    type: String,
    required: true,
    unique: true,
  },
  // Detailed description of the product
  description: {
    type: String,
    required: true,
  },
  // Price of the product
  price: {
    type: Number,
    required: true,
  },
  // Gender: Male, Female
  gender: {
    type: String,
    enum: ['Male', 'Female'],
  },
  // Product category (e.g., Shirts, Dresses, Footwear)
  category: {
    type: String,
    required: true,
  },
  // Quantity
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  // Main image URL
  mainImage: {
    type: String,
    required: true,
  },
  // Image shown on hover
  hoverImage: {
    type: String,
    required: true,
  },
  // Array of available sizes (e.g., ['S', 'M', 'L'])
  sizes: {
    type: [String],
    default: [],
  },
  // Optional tags
  tags: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);
export default Product;
