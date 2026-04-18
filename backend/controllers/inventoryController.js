// controllers/inventoryController.js
const Material      = require('../models/Material');
const InventoryLog  = require('../models/InventoryLog');
const Site          = require('../models/Site');
const User          = require('../models/User');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { notifyLowStock } = require('../utils/notificationHelper');

// ── GET /inventory?siteId= ──────────────────────────────────────────────────
const getStock = async (req, res) => {
  try {
    const { siteId } = req.query;
    const query = { isActive: true };
    if (siteId && siteId !== 'all') query.site = siteId;
    
    const materials = await Material.find(query).lean();
    const result = materials.map(m => ({
      ...m,
      isLowStock: m.currentStock <= m.minThreshold,
      stockValue: +(m.currentStock * m.unitCost).toFixed(2),
    }));
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, 'Failed to fetch stock', 500);
  }
};

// ── GET /inventory/materials?siteId= ────────────────────────────────────────
const getMaterials = async (req, res) => {
  try {
    const { siteId } = req.query;
    const materials = await Material.find({ site: siteId, isActive: true })
      .select('name category unit emoji currentStock minThreshold unitCost')
      .lean();
    return sendSuccess(res, materials);
  } catch (err) {
    return sendError(res, 'Failed to fetch materials', 500);
  }
};

// ── POST /inventory/materials ───────────────────────────────────────────────
const createMaterial = async (req, res) => {
  try {
    const { siteId, name, category, unit, minThreshold, maxCapacity, unitCost, emoji } = req.body;
    const material = await Material.create({
      site: siteId, name, category, unit, minThreshold, maxCapacity, unitCost, emoji,
      createdBy: req.user._id,
    });
    return sendSuccess(res, material, 'Material added to catalogue', 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create material', 400);
  }
};

// ── POST /inventory/log ─────────────────────────────────────────────────────
const logMaterial = async (req, res) => {
  try {
    const { siteId, materialId, type, quantity, notes, supplier, purpose, offlineId } = req.body;

    const material = await Material.findOne({ _id: materialId, site: siteId });
    if (!material) return sendError(res, 'Material not found', 404);

    // Prevent negative stock on OUT
    if (type === 'out' && material.currentStock < quantity) {
      return sendError(res, `Insufficient stock. Available: ${material.currentStock} ${material.unit}`, 400);
    }

    // Update stock
    const delta = type === 'in' ? +quantity : -quantity;
    material.currentStock = +(material.currentStock + delta).toFixed(4);
    await material.save();

    // Record log
    const log = await InventoryLog.create({
      site: siteId, material: materialId,
      loggedBy: req.user._id,
      type, quantity,
      balanceAfter: material.currentStock,
      unitCost: material.unitCost,
      totalCost: +(quantity * material.unitCost).toFixed(2),
      notes, supplier, purpose, offlineId,
      syncedAt: offlineId ? new Date() : null,
    });

    // Low stock notification
    if (material.isLowStock || material.currentStock <= material.minThreshold) {
      const site = await Site.findById(siteId).populate('manager', '_id');
      const recipients = [site?.manager?._id, req.user._id].filter(Boolean);
      if (recipients.length) {
        await notifyLowStock(recipients, siteId, material.name, material.currentStock, material.unit);
      }
    }

    return sendSuccess(res, { log, newStock: material.currentStock }, 'Material logged');
  } catch (err) {
    return sendError(res, err.message || 'Failed to log material', 400);
  }
};

// ── GET /inventory/logs?siteId= ─────────────────────────────────────────────
const getLogs = async (req, res) => {
  try {
    const { siteId, materialId, page = 1, limit = 30, type } = req.query;
    const query = {};
    if (siteId && siteId !== 'all') query.site = siteId;
    if (materialId) query.material = materialId;
    if (type) query.type = type;

    const total = await InventoryLog.countDocuments(query);
    const logs = await InventoryLog.find(query)
      .populate('material', 'name unit category emoji')
      .populate('loggedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return sendPaginated(res, logs, total, page, limit);
  } catch (err) {
    return sendError(res, 'Failed to fetch logs', 500);
  }
};

// ── GET /inventory/alerts?siteId= ───────────────────────────────────────────
const getLowStockAlerts = async (req, res) => {
  try {
    const { siteId } = req.query;
    const materials = await Material.find({ site: siteId, isActive: true }).lean();
    const alerts = materials.filter(m => m.currentStock <= m.minThreshold);
    return sendSuccess(res, alerts);
  } catch (err) {
    return sendError(res, 'Failed to fetch alerts', 500);
  }
};

// ── GET /inventory/summary?siteId= ──────────────────────────────────────────
const getInventorySummary = async (req, res) => {
  try {
    const { siteId } = req.query;
    const query = { isActive: true };
    if (siteId && siteId !== 'all') query.site = siteId;
    const materials = await Material.find(query).lean();

    const totalItems = materials.length;
    const lowStockCount = materials.filter(m => m.currentStock <= m.minThreshold).length;
    const totalValue = materials.reduce((a, m) => a + m.currentStock * m.unitCost, 0);

    // Last 7 days logs
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const logQuery = { createdAt: { $gte: since } };
    if (siteId && siteId !== 'all') logQuery.site = siteId;
    const recentLogs = await InventoryLog.find(logQuery).lean();
    const inCount  = recentLogs.filter(l => l.type === 'in').reduce((a, l) => a + l.quantity, 0);
    const outCount = recentLogs.filter(l => l.type === 'out').reduce((a, l) => a + l.quantity, 0);

    return sendSuccess(res, { totalItems, lowStockCount, totalValue: +totalValue.toFixed(2), last7Days: { in: inCount, out: outCount } });
  } catch (err) {
    return sendError(res, 'Failed to fetch summary', 500);
  }
};

module.exports = { getStock, getMaterials, createMaterial, logMaterial, getLogs, getLowStockAlerts, getInventorySummary };
