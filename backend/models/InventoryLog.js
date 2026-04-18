// models/InventoryLog.js — Every material IN/OUT transaction
const mongoose = require('mongoose');

const InventoryLogSchema = new mongoose.Schema({
  site:     { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  type: { type: String, enum: ['in', 'out'], required: true },
  quantity: { type: Number, required: true, min: 0.01 },
  balanceAfter: { type: Number, required: true },   // snapshot of stock after this tx

  unitCost: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },          // quantity * unitCost

  // Source / destination
  supplier: { type: String, trim: true },           // for IN
  purpose: { type: String, trim: true },            // for OUT (e.g. "2nd floor slab")
  notes: { type: String, trim: true },

  // Offline sync metadata
  offlineId: { type: String, default: null },       // client-side UUID if queued offline
  syncedAt:  { type: Date, default: null },
}, { timestamps: true });

InventoryLogSchema.index({ site: 1, createdAt: -1 });
InventoryLogSchema.index({ material: 1, createdAt: -1 });
InventoryLogSchema.index({ loggedBy: 1 });

module.exports = mongoose.model('InventoryLog', InventoryLogSchema);
