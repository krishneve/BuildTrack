// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { JWT_EXPIRY } = require('../config/constants');

const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY.ACCESS });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: JWT_EXPIRY.REFRESH });

// POST /api/v1/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    // Find user and include password field
    const user = await User.findOne({ email, isActive: true }).select('+password').populate('primarySite', 'name');
    if (!user || !(await user.comparePassword(password))) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Return user info + tokens
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation,
      assignedSites: user.assignedSites,
      primarySite: user.primarySite,
    };

    return sendSuccess(res, { user: userData, accessToken, refreshToken }, 'Login successful');
  } catch (err) {
    return sendError(res, 'Login failed', 500);
  }
};

// POST /api/v1/auth/refresh
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return sendError(res, 'Refresh token required', 400);

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return sendError(res, 'Invalid token', 401);

    const newAccessToken = signAccessToken(user._id);
    return sendSuccess(res, { accessToken: newAccessToken }, 'Token refreshed');
  } catch (err) {
    return sendError(res, 'Invalid or expired refresh token', 401);
  }
};

// POST /api/v1/auth/logout
const logout = async (req, res) => {
  // Client-side token deletion; if using refresh token storage, clear here
  return sendSuccess(res, null, 'Logged out successfully');
};

module.exports = { login, refreshToken, logout };
