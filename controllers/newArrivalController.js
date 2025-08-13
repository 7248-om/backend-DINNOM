// controllers/newArrivalController.js
import NewArrival from '../models/newArrival.js';
export const getNewArrivals = async (req, res) => {
  try {
    const doc = await NewArrival.findOne().populate('productIds');
    res.json(doc?.productIds || []);
  } catch (err) {
    res.status(500).json({ message: "Error fetching new arrivals" });
  }
};
export const updateNewArrivals = async (req, res) => {
  try {
    const { productIds } = req.body; // array of 3 product ObjectIds
    let doc = await NewArrival.findOne();
    if (!doc) {
      doc = new NewArrival({ productIds });
    } else {
      doc.productIds = productIds;
    }
    await doc.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to update new arrivals" });
  }
};

