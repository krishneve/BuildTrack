// models/Worker.js
// Daily/contract labourers tracked by site manager (NOT system users)
// These are the field workers who are NOT in the User table
const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Identity
  name:    { type: String, required: true, trim: true },
  phone:   { type: String, trim: true },
  address: { type: String, trim: true },
  aadhaarLast4: { type: String, trim: true, maxlength: 4 },

  // Classification
  trade: {
    type: String,
    enum: ['mason', 'carpenter', 'electrician', 'plumber', 'welder', 'helper', 'painter', 'supervisor', 'driver', 'other'],
    required: true,
  },
  employmentType: {
    type: String,
    enum: ['daily', 'weekly', 'contract'],
    default: 'daily',
  },

  // Wages
  wageType: { type: String, enum: ['per_day', 'per_week', 'fixed_monthly'], default: 'per_day' },
  wageAmount: { type: Number, required: true, min: 0 }, // INR

  // Status
  isActive: { type: Boolean, default: true },
  joinDate: { type: Date, default: Date.now },
  leaveDate: { type: Date, default: null },
  notes:  { type: String, trim: true },

  // Emergency contact
  emergencyContact: {
    name:  { type: String, trim: true },
    phone: { type: String, trim: true },
  },
}, { timestamps: true, toJSON: { virtuals: true } });

WorkerSchema.index({ site: 1, isActive: 1 });
WorkerSchema.index({ site: 1, trade: 1 });

// Virtual: days on site
WorkerSchema.virtual('daysOnSite').get(function () {
  const end = this.leaveDate || new Date();
  return Math.ceil((end - this.joinDate) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Worker', WorkerSchema);
