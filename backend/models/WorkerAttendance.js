const mongoose = require('mongoose');

const WorkerAttendanceSchema = new mongoose.Schema({
  site:   { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  date:   { type: Date, required: true },
  
  status: {
    type: String,
    enum: ['present', 'absent', 'half_day'],
    default: 'present',
  },

  // Snapshot of wage at marking time
  dailyWage: { type: Number, required: true },

  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes:    { type: String, trim: true },

}, { timestamps: true });

// Ensure one record per worker per day
WorkerAttendanceSchema.index({ site: 1, worker: 1, date: 1 }, { unique: true });
WorkerAttendanceSchema.index({ site: 1, date: -1 });

module.exports = mongoose.model('WorkerAttendance', WorkerAttendanceSchema);
