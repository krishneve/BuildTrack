// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  try {
    // 1. Extract token
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return sendError(res, 'Authentication required. Please log in.', 401);
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Session expired. Please log in again.', 401);
      }
      return sendError(res, 'Invalid token. Please log in again.', 401);
    }

    // 3. Check user still exists and is active
    const user = await User.findById(decoded.id).select('+passwordChangedAt');
    if (!user || !user.isActive) {
      return sendError(res, 'User account not found or deactivated.', 401);
    }

    // 4. Check password not changed after token issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return sendError(res, 'Password was changed. Please log in again.', 401);
    }

    // 5. Attach to request
    req.user = user;
    next();
  } catch (err) {
    return sendError(res, 'Authentication error', 500);
  }
};

module.exports = { protect };
