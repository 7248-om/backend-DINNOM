import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/users/me - get logged-in user info
router.get('/me', protect, (req, res) => {
  // req.user is populated by middleware with full user doc
  if (!req.user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Send only needed fields
  const { displayName, email, photoURL } = req.user;
  res.json({ displayName, email, photoURL });
});

// PUT /api/users/me - update logged-in user info
router.put('/me', protect, async (req, res) => {
  const { displayName, email } = req.body;

  if (!req.user) {
    return res.status(404).json({ message: 'User not found' });
  }

  try {
    req.user.displayName = displayName || req.user.displayName;
    req.user.email = email || req.user.email;

    const updatedUser = await req.user.save();

    // Return updated user fields
    res.json({
      displayName: updatedUser.displayName,
      email: updatedUser.email,
      photoURL: updatedUser.photoURL,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

export default router;
