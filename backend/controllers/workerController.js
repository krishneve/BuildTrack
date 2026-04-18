// controllers/workerController.js
const Worker  = require('../models/Worker');
const Payment = require('../models/Payment');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');

// GET /workers?siteId=&trade=&isActive=
const getWorkers = async (req, res) => {
  try {
    const { siteId, trade, isActive, page = 1, limit = 50, search } = req.query;
    const query = { site: siteId };
    if (trade) query.trade = trade;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    else query.isActive = true; // default active only
    if (search) query.name = { $regex: search, $options: 'i' };

    const total  = await Worker.countDocuments(query);
    const workers = await Worker.find(query)
      .sort({ trade: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return sendPaginated(res, workers, total, page, limit);
  } catch (err) {
    return sendError(res, 'Failed to fetch workers', 500);
  }
};

// GET /workers/:id
const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findOne({ _id: req.params.id, site: req.query.siteId });
    if (!worker) return sendError(res, 'Worker not found', 404);
    return sendSuccess(res, worker);
  } catch (err) {
    return sendError(res, 'Failed', 500);
  }
};

// POST /workers
const createWorker = async (req, res) => {
  try {
    const { siteId } = req.body;
    const worker = await Worker.create({ ...req.body, site: siteId, createdBy: req.user._id });
    return sendSuccess(res, worker, 'Worker added', 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create worker', 400);
  }
};

// PUT /workers/:id
const updateWorker = async (req, res) => {
  try {
    const worker = await Worker.findOneAndUpdate(
      { _id: req.params.id, site: req.body.siteId || req.query.siteId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!worker) return sendError(res, 'Worker not found', 404);
    return sendSuccess(res, worker, 'Worker updated');
  } catch (err) {
    return sendError(res, 'Failed to update worker', 400);
  }
};

// DELETE /workers/:id  (soft-deactivate)
const deleteWorker = async (req, res) => {
  try {
    const worker = await Worker.findOneAndUpdate(
      { _id: req.params.id },
      { isActive: false, leaveDate: new Date() },
      { new: true }
    );
    if (!worker) return sendError(res, 'Worker not found', 404);
    return sendSuccess(res, null, 'Worker deactivated');
  } catch (err) {
    return sendError(res, 'Failed', 500);
  }
};

// GET /workers/stats?siteId= — trade breakdown for dashboard
const getWorkerStats = async (req, res) => {
  try {
    const { siteId } = req.query;
    const [total, byTrade] = await Promise.all([
      Worker.countDocuments({ site: siteId, isActive: true }),
      Worker.aggregate([
        { $match: { site: new (require('mongoose').Types.ObjectId)(siteId), isActive: true } },
        { $group: { _id: '$trade', count: { $sum: 1 }, avgWage: { $avg: '$wageAmount' } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Total weekly wage bill
    const workers = await Worker.find({ site: siteId, isActive: true }).select('wageAmount wageType').lean();
    const weeklyBill = workers.reduce((acc, w) => {
      if (w.wageType === 'per_day') return acc + w.wageAmount * 6;
      if (w.wageType === 'per_week') return acc + w.wageAmount;
      return acc + w.wageAmount / 4;
    }, 0);

    return sendSuccess(res, { total, byTrade, estimatedWeeklyBill: +weeklyBill.toFixed(0) });
  } catch (err) {
    return sendError(res, 'Failed', 500);
  }
};

// POST /workers/:id/payment — Create payment for a specific worker
const createWorkerPayment = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return sendError(res, 'Worker not found', 404);

    const { days, period, notes, method } = req.body;
    let amount = worker.wageAmount;
    if (worker.wageType === 'per_day' && days) amount = worker.wageAmount * Number(days);

    const payment = await Payment.create({
      site:      worker.site,
      createdBy: req.user._id,
      payeeType: 'worker',
      payeeName: worker.name,
      payeeRef:  null,
      type:      'weekly_labor',
      amount,
      period:    period || `${days || 1} days`,
      method:    method || 'cash',
      notes,
    });

    return sendSuccess(res, payment, 'Payment created for worker', 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed', 400);
  }
};

module.exports = { getWorkers, getWorkerById, createWorker, updateWorker, deleteWorker, getWorkerStats, createWorkerPayment };
