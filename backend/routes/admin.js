const express = require("express");
const router = express.Router();
const { authenticate, authorize, requirePermission } = require("../middleware/auth");
const { ROLES, PERMISSIONS } = require("../config/roles");

const {
  createSite, getAllSites, getSiteById, updateSite, deleteSite,
  assignManager, assignEngineer, updateBudget, getSitesOverview,
} = require("../controllers/siteController");

const {
  createUser, getAllUsers, getUserById, updateUser,
  toggleUserStatus, getUsersByRole, getUserStats,
} = require("../controllers/userController");

const {
  getDashboardStats, getSiteComparison, getBudgetTrends,
} = require("../controllers/analyticsController");

// ─── All admin routes require authentication + admin role ─────────────────────
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get("/dashboard", getDashboardStats);

// ─── Sites ────────────────────────────────────────────────────────────────────
router.get("/sites/overview", getSitesOverview);
router.get("/sites", requirePermission(PERMISSIONS.SITE_READ), getAllSites);
router.post("/sites", requirePermission(PERMISSIONS.SITE_CREATE), createSite);
router.get("/sites/:id", requirePermission(PERMISSIONS.SITE_READ), getSiteById);
router.put("/sites/:id", requirePermission(PERMISSIONS.SITE_UPDATE), updateSite);
router.delete("/sites/:id", requirePermission(PERMISSIONS.SITE_DELETE), deleteSite);
router.post("/sites/:id/assign-manager", requirePermission(PERMISSIONS.USER_ASSIGN), assignManager);
router.post("/sites/:id/assign-engineer", requirePermission(PERMISSIONS.USER_ASSIGN), assignEngineer);

// ─── Budget ───────────────────────────────────────────────────────────────────
router.put("/sites/:id/budget", requirePermission(PERMISSIONS.BUDGET_MODIFY), updateBudget);

// ─── Users ────────────────────────────────────────────────────────────────────
router.get("/users/stats", requirePermission(PERMISSIONS.USER_READ), getUserStats);
router.get("/users/by-role/:role", requirePermission(PERMISSIONS.USER_READ), getUsersByRole);
router.get("/users", requirePermission(PERMISSIONS.USER_READ), getAllUsers);
router.post("/users", requirePermission(PERMISSIONS.USER_CREATE), createUser);
router.get("/users/:id", requirePermission(PERMISSIONS.USER_READ), getUserById);
router.put("/users/:id", requirePermission(PERMISSIONS.USER_UPDATE), updateUser);
router.patch("/users/:id/toggle-status", requirePermission(PERMISSIONS.USER_UPDATE), toggleUserStatus);

// ─── Analytics ────────────────────────────────────────────────────────────────
router.get("/analytics/site-comparison", requirePermission(PERMISSIONS.ANALYTICS_VIEW), getSiteComparison);
router.get("/analytics/budget-trends", requirePermission(PERMISSIONS.ANALYTICS_VIEW), getBudgetTrends);

module.exports = router;
