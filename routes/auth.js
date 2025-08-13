// backend/routes/auth.js

import express from 'express';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import User from '../models/user.js'; // ✅ lowercase filename import

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-and-secure';

router.post('/google', async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { name, picture, email, uid } = decodedToken;

    const user = await User.findOneAndUpdate(
      { googleId: uid },
      {
        $set: {
          displayName: name,
          email: email,
          photoURL: picture,
        },
        $setOnInsert: {
          googleId: uid,
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const appToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      token: appToken,
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        wishlist: user.wishlist || [],
        isAdmin: user.isAdmin || false, //
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Authentication failed.' });
  }
});

export default router;
