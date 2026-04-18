// config/constants.js
// Central source of truth for roles, permissions, and app constants

const ROLES = {
  ADMIN: 'admin',
  SITE_MANAGER: 'site_manager',
  SITE_ENGINEER: 'site_engineer',
};

// Granular permissions
const PERMISSIONS = {
  // Site permissions
  SITE_CREATE: 'site:create',
  SITE_READ_ALL: 'site:read:all',
  SITE_READ_OWN: 'site:read:own',
  SITE_UPDATE_ALL: 'site:update:all',
  SITE_UPDATE_OWN: 'site:update:own',
  SITE_DELETE: 'site:delete',
  SITE_ASSIGN_MANAGER: 'site:assign:manager',
  SITE_ASSIGN_ENGINEER: 'site:assign:engineer',

  // User/Staff permissions
  USER_CREATE: 'user:create',
  USER_READ_ALL: 'user:read:all',
  USER_UPDATE: 'user:update',
  USER_DEACTIVATE: 'user:deactivate',

  // Budget permissions
  BUDGET_CREATE: 'budget:create',
  BUDGET_READ_ALL: 'budget:read:all',
  BUDGET_READ_OWN: 'budget:read:own',
  BUDGET_UPDATE: 'budget:update',

  // Analytics permissions
  ANALYTICS_VIEW_ALL: 'analytics:view:all',
  ANALYTICS_VIEW_OWN: 'analytics:view:own',

  // Inventory permissions
  INVENTORY_MANAGE: 'inventory:manage',
  INVENTORY_VIEW: 'inventory:view',

  // Payment permissions
  PAYMENT_MANAGE: 'payment:manage',
  PAYMENT_VIEW: 'payment:view',
  PAYMENT_APPROVE: 'payment:approve',

  // Invoice permissions
  INVOICE_MANAGE: 'invoice:manage',
  INVOICE_VIEW: 'invoice:view',
};

// Role → Permission mapping
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.SITE_CREATE,
    PERMISSIONS.SITE_READ_ALL,
    PERMISSIONS.SITE_UPDATE_ALL,
    PERMISSIONS.SITE_DELETE,
    PERMISSIONS.SITE_ASSIGN_MANAGER,
    PERMISSIONS.SITE_ASSIGN_ENGINEER,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ_ALL,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DEACTIVATE,
    PERMISSIONS.BUDGET_CREATE,
    PERMISSIONS.BUDGET_READ_ALL,
    PERMISSIONS.BUDGET_UPDATE,
    PERMISSIONS.ANALYTICS_VIEW_ALL,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.PAYMENT_MANAGE,
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.PAYMENT_APPROVE,
    PERMISSIONS.INVOICE_MANAGE,
    PERMISSIONS.INVOICE_VIEW,
  ],

  [ROLES.SITE_MANAGER]: [
    PERMISSIONS.SITE_READ_OWN,
    PERMISSIONS.SITE_UPDATE_OWN,
    PERMISSIONS.BUDGET_READ_OWN,
    PERMISSIONS.ANALYTICS_VIEW_OWN,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.PAYMENT_MANAGE,
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.INVOICE_MANAGE,
    PERMISSIONS.INVOICE_VIEW,
  ],

  [ROLES.SITE_ENGINEER]: [
    PERMISSIONS.SITE_READ_OWN,
    PERMISSIONS.BUDGET_READ_OWN,
    PERMISSIONS.ANALYTICS_VIEW_OWN,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.INVOICE_VIEW,
  ],
};

const SITE_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const BUDGET_STATUS = {
  ON_TRACK: 'on_track',
  AT_RISK: 'at_risk',      // >80% consumed
  OVERRUN: 'overrun',       // >100% consumed
};

const JWT_EXPIRY = {
  ACCESS: '8h',
  REFRESH: '7d',
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  SITE_STATUS,
  BUDGET_STATUS,
  JWT_EXPIRY,
};
