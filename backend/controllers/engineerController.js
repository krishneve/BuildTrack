// controllers/engineerController.js
// Engineer-optimised endpoints — fast, mobile-first payloads

const Attendance  = require('../models/Attendance');
const Material    = require('../models/Material');
const InventoryLog = require('../models/InventoryLog');
const Invoice     = require('../models/Invoice');
const Site        = require('../models/Site');
const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { notifyAttendancePending, notifyInvoicePending, notifyLowStock } = require('../utils/notificationHelper');

// ── GET /engineer/home?siteId= ─────────────────────────────────────────────
// Single endpoint that returns everything the Dashboard needs in one call
const getHome = async (req, res) => {
  try {
    const siteId = req.query.siteId || req.user.primarySite;
    if (!siteId) return sendError(res, 'No site assigned to your account', 400);

    const today      = new Date();
    const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(today); todayEnd.setHours(23, 59, 59, 999);

    const [site, myAttendance, materials, myInvoices, logs, unread] = await Promise.all([
      Site.findById(siteId).select('name status location metrics').lean(),
      Attendance.find({ worker: req.user._id, site: siteId, date: { $gte: todayStart, $lte: todayEnd } }).lean(),
      Material.find({ site: siteId, isActive: true }).select('name unit currentStock minThreshold emoji category').lean(),
      Invoice.find({ uploadedBy: req.user._id, site: siteId, createdAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
      InventoryLog.find({ site: siteId, createdAt: { $gte: todayStart, $lte: todayEnd } })
        .populate('material', 'name unit')
        .populate('loggedBy', 'name role')
        .lean(),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    if (!site) return sendError(res, 'Site not found', 404);

    const checkedIn  = myAttendance.find(a => a.type === 'in');
    const checkedOut = myAttendance.find(a => a.type === 'out');
    const lowStock   = materials.filter(m => m.currentStock <= m.minThreshold);

    return sendSuccess(res, {
      site: {
        name: site.name,
        status: site.status,
        city: site.location?.city,
        progressPercent: site.metrics?.progressPercent || 0,
      },
      today: {
        checkedIn:  !!checkedIn,
        checkedOut: !!checkedOut,
        checkInStatus:  checkedIn?.status  || null,
        checkOutStatus: checkedOut?.status || null,
        materialLogs:   logs.length,
        invoicesUploaded: myInvoices.length,
      },
      stock: {
        totalItems:   materials.length,
        lowStockCount: lowStock.length,
        lowStockItems: lowStock.map(m => ({ _id: m._id, name: m.name, currentStock: m.currentStock, unit: m.unit, minThreshold: m.minThreshold })),
      },
      recentLogs: logs.slice(0, 5).map(l => ({
        type: l.type,
        quantity: l.quantity,
        material: l.material?.name,
        unit: l.material?.unit,
        time: l.createdAt,
        by: l.loggedBy?.name,
      })),
      unreadNotifications: unread,
    });
  } catch (err) {
    console.error('[engineer/home]', err);
    return sendError(res, 'Failed to load home data', 500);
  }
};

// ── POST /engineer/attendance ──────────────────────────────────────────────
// Wraps attendanceController.markAttendance with engineer-specific validation
const markAttendance = async (req, res) => {
  try {
    const { siteId, type, notes, offlineId } = req.body;
    if (!['in', 'out'].includes(type)) return sendError(res, 'type must be "in" or "out"', 400);

    const siteCheck = await Site.findById(siteId).select('manager').populate('manager', '_id name');
    if (!siteCheck) return sendError(res, 'Site not found', 404);

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const existing = await Attendance.findOne({
      worker: req.user._id, site: siteId, type,
      date: { $gte: todayStart, $lte: todayEnd },
    });
    if (existing) return sendError(res, `Already marked ${type.toUpperCase()} today`, 409);

    // For check-out, must have checked in first
    if (type === 'out') {
      const hasIn = await Attendance.findOne({
        worker: req.user._id, site: siteId, type: 'in',
        date: { $gte: todayStart, $lte: todayEnd },
      });
      if (!hasIn) return sendError(res, 'You must check IN before checking OUT', 400);
    }

    const record = await Attendance.create({
      site: siteId, worker: req.user._id,
      date: new Date(), type, notes, offlineId,
      syncedAt: offlineId ? new Date() : null,
    });

    if (siteCheck.manager) {
      await notifyAttendancePending(siteCheck.manager._id, siteId, req.user.name);
    }

    return sendSuccess(res, {
      _id: record._id,
      type: record.type,
      status: record.status,
      date: record.date,
    }, `${type === 'in' ? 'Check-in' : 'Check-out'} recorded`, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to mark attendance', 400);
  }
};

// ── POST /engineer/material-in ─────────────────────────────────────────────
const materialIn = async (req, res) => {
  try {
    const { siteId, materialId, quantity, supplier, notes, offlineId } = req.body;
    if (!quantity || Number(quantity) <= 0) return sendError(res, 'Quantity must be > 0', 400);

    const material = await Material.findOne({ _id: materialId, site: siteId, isActive: true });
    if (!material) return sendError(res, 'Material not found', 404);

    material.currentStock = +(material.currentStock + Number(quantity)).toFixed(4);
    await material.save();

    const log = await InventoryLog.create({
      site: siteId, material: materialId,
      loggedBy: req.user._id, type: 'in', quantity: Number(quantity),
      balanceAfter: material.currentStock,
      totalCost: +(Number(quantity) * material.unitCost).toFixed(2),
      supplier, notes, offlineId,
      syncedAt: offlineId ? new Date() : null,
    });

    return sendSuccess(res, {
      logId: log._id,
      materialName: material.name,
      quantity: Number(quantity),
      unit: material.unit,
      newStock: material.currentStock,
    }, `${quantity} ${material.unit} of ${material.name} received`, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to log material IN', 400);
  }
};

// ── POST /engineer/material-out ────────────────────────────────────────────
const materialOut = async (req, res) => {
  try {
    const { siteId, materialId, quantity, purpose, notes, offlineId } = req.body;
    if (!quantity || Number(quantity) <= 0) return sendError(res, 'Quantity must be > 0', 400);

    const material = await Material.findOne({ _id: materialId, site: siteId, isActive: true });
    if (!material) return sendError(res, 'Material not found', 404);

    if (material.currentStock < Number(quantity)) {
      return sendError(res, `Only ${material.currentStock} ${material.unit} in stock`, 400);
    }

    material.currentStock = +(material.currentStock - Number(quantity)).toFixed(4);
    await material.save();

    const log = await InventoryLog.create({
      site: siteId, material: materialId,
      loggedBy: req.user._id, type: 'out', quantity: Number(quantity),
      balanceAfter: material.currentStock,
      totalCost: +(Number(quantity) * material.unitCost).toFixed(2),
      purpose, notes, offlineId,
      syncedAt: offlineId ? new Date() : null,
    });

    // Check low stock after OUT
    if (material.currentStock <= material.minThreshold) {
      const site = await Site.findById(siteId).populate('manager', '_id');
      const recipients = [site?.manager?._id, req.user._id].filter(Boolean);
      if (recipients.length) {
        await notifyLowStock(recipients, siteId, material.name, material.currentStock, material.unit);
      }
    }

    return sendSuccess(res, {
      logId: log._id,
      materialName: material.name,
      quantity: Number(quantity),
      unit: material.unit,
      newStock: material.currentStock,
      isLowStock: material.currentStock <= material.minThreshold,
    }, `${quantity} ${material.unit} of ${material.name} logged out`, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to log material OUT', 400);
  }
};

// ── GET /engineer/my-logs?siteId= ─────────────────────────────────────────
// All material logs submitted by this engineer for this site (today by default)
const getMyLogs = async (req, res) => {
  try {
    const { siteId, days = 7 } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    const logs = await InventoryLog.find({
      site: siteId,
      createdAt: { $gte: since },
    })
      .populate('material', 'name unit category emoji')
      .populate('loggedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(50);

    return sendSuccess(res, logs);
  } catch (err) {
    return sendError(res, 'Failed to fetch logs', 500);
  }
};

// ── POST /engineer/invoice ─────────────────────────────────────────────────
const uploadInvoice = async (req, res) => {
  try {
    const { siteId, supplierName, amount, gst, invoiceNumber, category, notes, invoiceDate } = req.body;
    if (!supplierName?.trim()) return sendError(res, 'Supplier name is required', 400);
    if (!amount || isNaN(amount) || Number(amount) <= 0) return sendError(res, 'Valid amount is required', 400);

    const site = await Site.findById(siteId).populate('manager', '_id').lean();
    if (!site) return sendError(res, 'Site not found', 404);

    const invoice = await Invoice.create({
      site: siteId,
      uploadedBy: req.user._id,
      supplierName: supplierName.trim(),
      amount: Number(amount),
      gst: Number(gst || 0),
      invoiceNumber: invoiceNumber?.trim() || null,
      category: category || 'materials',
      notes: notes?.trim() || null,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
    });

    if (site.manager) {
      await notifyInvoicePending(site.manager._id, siteId, req.user.name, amount);
    }

    return sendSuccess(res, {
      _id: invoice._id,
      supplierName: invoice.supplierName,
      totalAmount: invoice.totalAmount,
      status: invoice.status,
    }, 'Invoice submitted for approval', 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to upload invoice', 400);
  }
};

// ── GET /engineer/my-invoices?siteId= ─────────────────────────────────────
const getMyInvoices = async (req, res) => {
  try {
    const { siteId, page = 1, limit = 20 } = req.query;
    const invoices = await Invoice.find({
      uploadedBy: req.user._id,
      site: siteId,
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return sendSuccess(res, invoices);
  } catch (err) {
    return sendError(res, 'Failed to fetch invoices', 500);
  }
};

// ── GET /engineer/stock?siteId= ────────────────────────────────────────────
const getStock = async (req, res) => {
  try {
    const { siteId } = req.query;
    const materials = await Material.find({ site: siteId, isActive: true })
      .select('name category unit emoji currentStock minThreshold maxCapacity unitCost')
      .sort({ category: 1, name: 1 })
      .lean();

    return sendSuccess(res, materials.map(m => ({
      ...m,
      isLowStock: m.currentStock <= m.minThreshold,
      stockValue: +(m.currentStock * m.unitCost).toFixed(2),
      fillPercent: m.maxCapacity ? Math.min(+(m.currentStock / m.maxCapacity * 100).toFixed(1), 100) : null,
    })));
  } catch (err) {
    return sendError(res, 'Failed to fetch stock', 500);
  }
};

// ── POST /engineer/add-material ────────────────────────────────────────────
const createMaterial = async (req, res) => {
  try {
    const { siteId, name, category, unit, minThreshold, maxCapacity, unitCost, emoji, image } = req.body;
    if (!name || !category || !unit) return sendError(res, 'Missing required fields', 400);

    const material = await Material.create({
      site: siteId,
      name,
      category,
      unit,
      minThreshold: Number(minThreshold || 0),
      maxCapacity: Number(maxCapacity || 0),
      unitCost: Number(unitCost || 0),
      emoji,
      image,
      createdBy: req.user._id,
    });

    return sendSuccess(res, material, 'Material added to catalogue', 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create material', 400);
  }
};

module.exports = { getHome, markAttendance, materialIn, materialOut, getMyLogs, uploadInvoice, getMyInvoices, getStock, createMaterial };
