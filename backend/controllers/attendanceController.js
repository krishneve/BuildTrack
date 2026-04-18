const Attendance = require('../models/Attendance');
const Site = require('../models/Site');
const User = require('../models/User');
const Worker = require('../models/Worker');
const WorkerAttendance = require('../models/WorkerAttendance');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { notifyAttendancePending, notifyAttendanceResult } = require('../utils/notificationHelper');

// POST /attendance — Engineer marks own attendance
const markAttendance = async (req, res) => {
  try {
    const { siteId, type, notes, offlineId } = req.body;

    // Check for duplicate today+type
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);
    const existing = await Attendance.findOne({
      worker: req.user._id, site: siteId, type,
      date: { $gte: todayStart, $lte: todayEnd },
    });
    if (existing) return sendError(res, `You have already marked ${type.toUpperCase()} today`, 409);

    const record = await Attendance.create({
      site: siteId, worker: req.user._id,
      date: new Date(), type, notes, offlineId,
    });

    // Notify manager
    const site = await Site.findById(siteId).populate('manager', '_id name');
    if (site?.manager) {
      await notifyAttendancePending(site.manager._id, siteId, req.user.name);
    }

    return sendSuccess(res, record, 'Attendance marked', 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to mark attendance', 400);
  }
};

// GET /attendance/today?siteId= — Today's records for a site
const getTodayAttendance = async (req, res) => {
  try {
    const { siteId } = req.query;
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);
    const records = await Attendance.find({
      site: siteId, date: { $gte: todayStart, $lte: todayEnd },
    }).populate('worker', 'name role designation');
    return sendSuccess(res, records);
  } catch (err) {
    return sendError(res, 'Failed', 500);
  }
};

// GET /attendance/pending?siteId= — Manager: all pending approvals
const getPendingApprovals = async (req, res) => {
  try {
    const { siteId } = req.query;
    const records = await Attendance.find({ site: siteId, status: 'pending' })
      .populate('worker', 'name role designation')
      .sort({ date: -1 });
    return sendSuccess(res, records);
  } catch (err) {
    return sendError(res, 'Failed', 500);
  }
};

// PUT /attendance/:id/status — Manager: approve or reject
const updateStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!['approved', 'rejected'].includes(status)) return sendError(res, 'Invalid status', 400);

    const record = await Attendance.findByIdAndUpdate(req.params.id, {
      status, remarks,
      approvedBy: req.user._id,
      approvedAt: new Date(),
    }, { new: true }).populate('worker', '_id name');

    if (!record) return sendError(res, 'Record not found', 404);

    // Notify worker
    await notifyAttendanceResult(record.worker._id, record.site, status);

    return sendSuccess(res, record, `Attendance ${status}`);
  } catch (err) {
    return sendError(res, 'Failed', 500);
  }
};

// GET /attendance/my — Engineer: own history
const getMyHistory = async (req, res) => {
  try {
    const { siteId, from, to } = req.query;
    const query = { worker: req.user._id };
    if (siteId) query.site = siteId;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }
    const records = await Attendance.find(query).sort({ date: -1 }).limit(60);
    return sendSuccess(res, records);
  } catch (err) {
    return sendError(res, 'Failed', 500);
  }
};

// GET /attendance/summary?siteId=&date= — Daily headcount
const getDailySummary = async (req, res) => {
  try {
    const { siteId, date } = req.query;
    const d = date ? new Date(date) : new Date();
    const start = new Date(d); start.setHours(0,0,0,0);
    const end   = new Date(d); end.setHours(23,59,59,999);

    const records = await Attendance.find({
      site: siteId, date: { $gte: start, $lte: end },
    }).populate('worker', 'name role designation');

    // Workers with check-in
    const checkedIn = new Set(records.filter(r => r.type === 'in').map(r => r.worker?._id?.toString()));
    const checkedOut = new Set(records.filter(r => r.type === 'out').map(r => r.worker?._id?.toString()));

    // Combine into per-worker status
    const workerMap = {};
    records.forEach(r => {
      const id = r.worker?._id?.toString();
      if (!workerMap[id]) workerMap[id] = { ...r.worker._doc || r.worker, todayStatus: 'absent' };
      if (r.type === 'in' && r.status !== 'rejected') workerMap[id].todayStatus = 'present';
    });

    return sendSuccess(res, {
      presentCount: checkedIn.size,
      absentCount: 0,
      totalWorkers: Object.keys(workerMap).length,
      workers: Object.values(workerMap),
    });
  } catch (err) {
    return sendError(res, 'Failed to fetch summary', 500);
  }
};

// GET /attendance/workers — Get all workers for a site + their attendance for a specific date
const getWorkerAttendance = async (req, res) => {
  try {
    const { siteId, date } = req.query;
    if (!siteId) return sendError(res, 'siteId is required', 400);

    const d = date ? new Date(date) : new Date();
    d.setHours(0, 0, 0, 0);

    const workers = await Worker.find({ site: siteId, isActive: true });
    const attendance = await WorkerAttendance.find({
      site: siteId,
      date: {
        $gte: new Date(d),
        $lte: new Date(new Date(d).setHours(23, 59, 59, 999))
      }
    });

    // Merge attendance into workers
    const data = workers.map(w => {
      const att = attendance.find(a => a.worker.toString() === w._id.toString());
      return {
        _id: w._id,
        name: w.name,
        trade: w.trade,
        wageAmount: w.wageAmount,
        status: att ? att.status : 'absent_default' // 'absent_default' means not marked as present yet
      };
    });

    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, 'Failed to fetch worker attendance', 500);
  }
};

// POST /attendance/bulk — Mark attendance for multiple workers
const bulkMarkAttendance = async (req, res) => {
  try {
    const { siteId, date, records } = req.body; // records: [{ workerId, status }]
    if (!siteId || !records) return sendError(res, 'Missing siteId or records', 400);

    const d = date ? new Date(date) : new Date();
    d.setHours(0, 0, 0, 0);

    const ops = await Promise.all(records.map(async (r) => {
      const worker = await Worker.findById(r.workerId);
      if (!worker) return null;

      return {
        updateOne: {
          filter: { site: siteId, worker: r.workerId, date: d },
          update: {
            $set: {
              status: r.status,
              dailyWage: worker.wageAmount,
              markedBy: req.user._id
            }
          },
          upsert: true
        }
      };
    }));

    const result = await WorkerAttendance.bulkWrite(ops.filter(o => o !== null));
    return sendSuccess(res, result, 'Attendance updated successfully');
  } catch (err) {
    return sendError(res, err.message || 'Bulk update failed', 500);
  }
};

// GET /attendance/report — Detailed attendance & wage report
const getAttendanceReport = async (req, res) => {
  try {
    const { siteId, from, to } = req.query;
    if (!siteId) return sendError(res, 'siteId required', 400);

    const match = { site: siteId };
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = new Date(from);
      if (to) match.date.$lte = new Date(to);
    }

    const records = await WorkerAttendance.find(match)
      .populate('worker', 'name trade phone aadhaarLast4')
      .sort({ date: -1 });

    return sendSuccess(res, records);
  } catch (err) {
    return sendError(res, 'Failed to generate report', 500);
  }
};

module.exports = { 
  markAttendance, 
  getTodayAttendance, 
  getPendingApprovals, 
  updateStatus, 
  getMyHistory, 
  getDailySummary,
  getWorkerAttendance,
  bulkMarkAttendance,
  getAttendanceReport
};
