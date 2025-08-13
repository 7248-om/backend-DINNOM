import mongoose from 'mongoose';

const newArrivalSchema = new mongoose.Schema({
  productIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
  ],
});

export default mongoose.model('NewArrival', newArrivalSchema);
