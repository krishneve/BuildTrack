// models/Attendance.js — Daily worker check-in/out
const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  site:   { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  date: { type: Date, required: true },
  type: { type: String, enum: ['in', 'out'], required: true },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },

  markedAt: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
  remarks: { type: String, trim: true },
  notes:   { type: String, trim: true },

  // Offline support
  offlineId: { type: String, default: null },
}, { timestamps: true });

AttendanceSchema.index({ site: 1, date: -1 });
AttendanceSchema.index({ worker: 1, date: -1 });
AttendanceSchema.index({ site: 1, status: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
