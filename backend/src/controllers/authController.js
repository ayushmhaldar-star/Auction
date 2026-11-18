const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    const admin = await Admin.findOne({ username: username.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.'
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.'
      });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Admin login successful.',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.',
      error: error.message
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    return res.json({
      success: true,
      admin: req.admin
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin profile.',
      error: error.message
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }

    const admin = await Admin.findById(req.admin._id);
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    admin.password = newPassword;
    await admin.save();

    return res.json({
      success: true,
      message: 'Admin password updated successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to change password.',
      error: error.message
    });
  }
};
