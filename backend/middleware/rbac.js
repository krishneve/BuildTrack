// middleware/rbac.js
// Role-Based Access Control middleware
const { ROLE_PERMISSIONS } = require('../config/constants');
const { sendError } = require('../utils/apiResponse');

/**
 * authorize(...permissions)
 * Usage: router.get('/path', protect, authorize('site:read:all'), handler)
 * Checks if logged-in user's role has ALL required permissions.
 */
const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];

    const hasAll = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasAll) {
      return sendError(
        res,
        `Access denied. Your role '${req.user.role}' does not have permission for this action.`,
        403
      );
    }

    next();
  };
};

/**
 * restrictTo(...roles)
 * Usage: router.delete('/sites/:id', protect, restrictTo('admin'), handler)
 * Simpler role-only check.
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. This action requires one of: ${roles.join(', ')}.`,
        403
      );
    }
    next();
  };
};

/**
 * siteAccess
 * Ensures non-admin users can only access sites they're assigned to.
 * Admin bypasses this check.
 */
const siteAccess = async (req, res, next) => {
  const { ROLES } = require('../config/constants');
  if (req.user.role === ROLES.ADMIN) return next(); // Admin sees all

  const siteId = req.params.siteId || req.params.id || req.body.siteId || req.query.siteId;
  if (!siteId) return next();

  const isAssigned = req.user.assignedSites.some(
    (s) => s.toString() === siteId.toString()
  );

  if (!isAssigned) {
    return sendError(res, 'You do not have access to this site.', 403);
  }

  next();
};

module.exports = { authorize, restrictTo, siteAccess };
