// models/Material.js — Master material catalogue per site
const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['cement', 'steel', 'bricks', 'sand', 'aggregate', 'wood', 'paint', 'plumbing', 'electrical', 'safety', 'other'],
    required: true,
  },
  unit: { type: String, required: true, default: 'kg' }, // kg, bags, pcs, litre, sqft
  emoji: { type: String, default: '▦' },
  currentStock: { type: Number, default: 0, min: 0 },
  minThreshold: { type: Number, default: 0 },   // triggers low-stock alert
  maxCapacity: { type: Number, default: null },
  unitCost: { type: Number, default: 0 },        // cost per unit for value calc
  image: { type: String },                       // optional photo of material
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

MaterialSchema.index({ site: 1, isActive: 1 });
MaterialSchema.index({ site: 1, category: 1 });

// Virtual: total stock value
MaterialSchema.virtual('stockValue').get(function () {
  return +(this.currentStock * this.unitCost).toFixed(2);
});

// Virtual: is low stock
MaterialSchema.virtual('isLowStock').get(function () {
  return this.currentStock <= this.minThreshold;
});

module.exports = mongoose.model('Material', MaterialSchema);
