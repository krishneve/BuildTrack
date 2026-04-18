// controllers/siteController.js
const Site = require('../models/Site');
const User = require('../models/User');
const Budget = require('../models/Budget');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { ROLES } = require('../config/constants');

// GET /api/v1/admin/sites
const getAllSites = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = { isActive: true };
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };

    const total = await Site.countDocuments(query);
    const sites = await Site.find(query)
      .populate('manager', 'name email phone')
      .populate('engineers', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return sendPaginated(res, sites, total, page, limit);
  } catch (err) {
    return sendError(res, 'Failed to fetch sites', 500);
  }
};

// GET /api/v1/admin/sites/:id
const getSiteById = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id)
      .populate('manager', 'name email phone designation')
      .populate('engineers', 'name email phone designation')
      .populate('createdBy', 'name');

    if (!site || !site.isActive) {
      return sendError(res, 'Site not found', 404);
    }
    return sendSuccess(res, site);
  } catch (err) {
    return sendError(res, 'Failed to fetch site', 500);
  }
};

// POST /api/v1/admin/sites
const createSite = async (req, res) => {
  try {
    const site = await Site.create({ ...req.body, createdBy: req.user._id });
    return sendSuccess(res, site, 'Site created successfully', 201);
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 'A site with this name already exists', 409);
    }
    return sendError(res, err.message || 'Failed to create site', 400);
  }
};

// PUT /api/v1/admin/sites/:id
const updateSite = async (req, res) => {
  try {
    // Fields admin cannot change via this endpoint
    const restricted = ['createdBy', 'siteCode', 'manager', 'engineers'];
    restricted.forEach((f) => delete req.body[f]);

    const site = await Site.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!site) return sendError(res, 'Site not found', 404);
    return sendSuccess(res, site, 'Site updated successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to update site', 400);
  }
};

// DELETE /api/v1/admin/sites/:id  (soft delete)
const deleteSite = async (req, res) => {
  try {
    const site = await Site.findByIdAndUpdate(
      req.params.id,
      { isActive: false, deletedAt: new Date() },
      { new: true }
    );
    if (!site) return sendError(res, 'Site not found', 404);
    return sendSuccess(res, null, 'Site deleted successfully');
  } catch (err) {
    return sendError(res, 'Failed to delete site', 500);
  }
};

// POST /api/v1/admin/sites/:id/assign-manager
const assignManager = async (req, res) => {
  try {
    const { managerId } = req.body;
    const manager = await User.findOne({ _id: managerId, role: ROLES.SITE_MANAGER, isActive: true });
    if (!manager) return sendError(res, 'Manager not found or invalid role', 404);

    const site = await Site.findByIdAndUpdate(
      req.params.id,
      { manager: managerId },
      { new: true }
    ).populate('manager', 'name email');

    if (!site) return sendError(res, 'Site not found', 404);

    // Add site to manager's assignedSites
    await User.findByIdAndUpdate(managerId, {
      $addToSet: { assignedSites: site._id },
      primarySite: site._id,
    });

    return sendSuccess(res, site, 'Manager assigned successfully');
  } catch (err) {
    return sendError(res, 'Failed to assign manager', 500);
  }
};

// POST /api/v1/admin/sites/:id/assign-engineers
const assignEngineers = async (req, res) => {
  try {
    const { engineerIds } = req.body; // array of user IDs
    if (!Array.isArray(engineerIds) || !engineerIds.length) {
      return sendError(res, 'engineerIds array is required', 400);
    }

    // Validate all are engineers
    const engineers = await User.find({
      _id: { $in: engineerIds },
      role: ROLES.SITE_ENGINEER,
      isActive: true,
    });

    if (engineers.length !== engineerIds.length) {
      return sendError(res, 'One or more engineer IDs are invalid', 400);
    }

    const site = await Site.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { engineers: { $each: engineerIds } } },
      { new: true }
    ).populate('engineers', 'name email');

    if (!site) return sendError(res, 'Site not found', 404);

    // Update each engineer's assignedSites
    await User.updateMany(
      { _id: { $in: engineerIds } },
      { $addToSet: { assignedSites: site._id } }
    );

    return sendSuccess(res, site, 'Engineers assigned successfully');
  } catch (err) {
    return sendError(res, 'Failed to assign engineers', 500);
  }
};

module.exports = {
  getAllSites,
  getSiteById,
  createSite,
  updateSite,
  deleteSite,
  assignManager,
  assignEngineers,
};
