// controllers/userController.js
const User = require('../models/User');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { ROLES } = require('../config/constants');

// GET /api/v1/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, isActive } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .populate('assignedSites', 'name siteCode status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return sendPaginated(res, users, total, page, limit);
  } catch (err) {
    return sendError(res, 'Failed to fetch users', 500);
  }
};

// GET /api/v1/admin/users/unassigned
const getUnassignedUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = {
      isActive: true,
      $or: [{ assignedSites: { $size: 0 } }, { assignedSites: { $exists: false } }],
    };
    if (role) query.role = role;
    const users = await User.find(query).select('name email role designation');
    return sendSuccess(res, users);
  } catch (err) {
    return sendError(res, 'Failed to fetch unassigned users', 500);
  }
};

// POST /api/v1/admin/users
const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, designation, employeeId } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return sendError(res, 'Email already registered', 409);

    const user = await User.create({
      name, email, phone, password, role, designation, employeeId,
      createdBy: req.user._id,
    });

    // Don't return password
    const result = user.toObject();
    delete result.password;

    return sendSuccess(res, result, 'User created successfully', 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create user', 400);
  }
};

// PUT /api/v1/admin/users/:id
const updateUser = async (req, res) => {
  try {
    // Admin cannot change password via this endpoint (separate flow)
    const restricted = ['password', 'passwordChangedAt', 'refreshTokenHash'];
    restricted.forEach((f) => delete req.body[f]);

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, user, 'User updated successfully');
  } catch (err) {
    return sendError(res, 'Failed to update user', 500);
  }
};

// DELETE /api/v1/admin/users/:id  (deactivate, not delete)
const deactivateUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 'You cannot deactivate your own account', 400);
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, null, 'User deactivated successfully');
  } catch (err) {
    return sendError(res, 'Failed to deactivate user', 500);
  }
};

module.exports = { getAllUsers, getUnassignedUsers, createUser, updateUser, deactivateUser };
