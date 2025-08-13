import User from '../models/User.js';

// @desc    Get user's addresses
// @route   GET /api/users/addresses
// @access  Private
export const getUserAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.addresses || []);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add a new address
// @route   POST /api/users/addresses
// @access  Private
export const addAddress = async (req, res) => {
  try {
    const { name, address, city, state, postalCode, country, phone, type, isDefault } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
      const newAddress = { name, address, city, state, postalCode, country, phone, type, isDefault };

      // If this is the first address, make it default.
      // If isDefault is true, unset other defaults.
      if (user.addresses.length === 0) {
        newAddress.isDefault = true;
      } else if (newAddress.isDefault) {
        user.addresses.forEach(addr => (addr.isDefault = false));
      }

      user.addresses.push(newAddress);
      await user.save();
      res.status(201).json(user.addresses);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update an address
// @route   PUT /api/users/addresses/:id
// @access  Private
export const updateAddress = async (req, res) => {
  try {
    const { name, address, city, state, postalCode, country, phone, type, isDefault } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
      const addressToUpdate = user.addresses.id(req.params.id);
      if (!addressToUpdate) return res.status(404).json({ message: 'Address not found' });

      // If setting this one as default, unset others
      if (isDefault && !addressToUpdate.isDefault) {
        user.addresses.forEach(addr => (addr.isDefault = false));
      }

      addressToUpdate.set({ name, address, city, state, postalCode, country, phone, type, isDefault });
      
      await user.save();
      res.json(user.addresses);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete an address
// @route   DELETE /api/users/addresses/:id
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      const addressToDelete = user.addresses.id(req.params.id);
      if (!addressToDelete) return res.status(404).json({ message: 'Address not found' });

      const wasDefault = addressToDelete.isDefault;
      addressToDelete.deleteOne();

      // If the deleted address was the default, make another one default
      if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
      }

      await user.save();
      res.json(user.addresses);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Set an address as default
// @route   PUT /api/users/addresses/:id/default
// @access  Private
export const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      const addressToSetDefault = user.addresses.id(req.params.id);
      if (!addressToSetDefault) return res.status(404).json({ message: 'Address not found' });

      user.addresses.forEach(addr => (addr.isDefault = false));
      addressToSetDefault.isDefault = true;

      await user.save();
      res.json(user.addresses);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};