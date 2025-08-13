import ImageKit from 'imagekit';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

/**
 * @desc    Get ImageKit authentication parameters for client-side upload
 * @route   GET /api/imagekit/auth
 * @access  Private (for logged-in users/admins)
 */
export const getAuthParams = (req, res) => {
  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    res.json(authenticationParameters);
  } catch (error) {
    console.error('Error getting ImageKit auth params:', error);
    res.status(500).json({ message: 'Failed to get upload authentication.' });
  }
};

