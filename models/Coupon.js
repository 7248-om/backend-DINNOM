import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ['flat', 'percent'], required: true },
  discountValue: { type: Number, required: true },
  minCartAmount: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});

export default mongoose.model('Coupon', couponSchema);
