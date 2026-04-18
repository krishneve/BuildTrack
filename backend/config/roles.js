// ─── Roles ────────────────────────────────────────────────────────────────────
const ROLES = {
  ADMIN: "admin",
  SITE_MANAGER: "site_manager",
  SITE_ENGINEER: "site_engineer",
};

// ─── Permissions ──────────────────────────────────────────────────────────────
const PERMISSIONS = {
  // Sites
  SITE_CREATE: "sites:create",
  SITE_READ: "sites:read",
  SITE_UPDATE: "sites:update",
  SITE_DELETE: "sites:delete",

  // Users
  USER_CREATE: "users:create",
  USER_READ: "users:read",
  USER_UPDATE: "users:update",
  USER_DELETE: "users:delete",
  USER_ASSIGN: "users:assign",

  // Budget
  BUDGET_SET: "budget:set",
  BUDGET_MODIFY: "budget:modify",
  BUDGET_VIEW: "budget:view",

  // Analytics & Reports
  ANALYTICS_VIEW: "analytics:view",
  REPORTS_EXPORT: "reports:export",

  // Inventory (future)
  INVENTORY_READ: "inventory:read",
  INVENTORY_WRITE: "inventory:write",

  // Payments (future)
  PAYMENT_READ: "payment:read",
  PAYMENT_APPROVE: "payment:approve",
};

// ─── Role → Permission Map ─────────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Admin gets everything

  [ROLES.SITE_MANAGER]: [
    PERMISSIONS.SITE_READ,
    PERMISSIONS.BUDGET_VIEW,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_WRITE,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.ANALYTICS_VIEW,
  ],

  [ROLES.SITE_ENGINEER]: [
    PERMISSIONS.SITE_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_WRITE,
  ],
};

module.exports = { ROLES, PERMISSIONS, ROLE_PERMISSIONS };
