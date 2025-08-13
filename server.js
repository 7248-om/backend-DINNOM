import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import admin from 'firebase-admin';
import fs from 'fs';

// Routes
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/order.js';
import productRoutes from './routes/product.js';
import chatbotRoutes from './routes/chatbot.js';
import couponRoutes from './routes/coupons.js';
import paymentRoutes from './routes/payment.js';
import imagekitRoutes from './routes/imagekitRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import userRoutes from './routes/user.js';
import newArrivalRoutes from './routes/newArrivalRoutes.js';

// --------------------
// Firebase Admin Setup
// --------------------
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Running in production (Render)
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // Running locally
  serviceAccount = JSON.parse(
    fs.readFileSync(new URL('./serviceAccountKey.json', import.meta.url))
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// --------------------
// Express App Setup
// --------------------
const app = express();
app.use(cors());
app.use(express.json());

// --------------------
// Database Connection
// --------------------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// --------------------
// API Routes
// --------------------
app.use('/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/new-arrivals', newArrivalRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/imagekit', imagekitRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/users', userRoutes);

app.get('/api', (req, res) => {
  res.json(['diya', 'nidhi', 'om', 'nihar']);
});

// --------------------
// Start server in all environments
// --------------------
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
