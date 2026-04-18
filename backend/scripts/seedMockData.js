require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Site = require('../models/Site');
const Material = require('../models/Material');
const InventoryLog = require('../models/InventoryLog');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const connectDB = require('../config/db');

const seedMockData = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding mock data...');

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('No admin user found to attribute creation to.');
      process.exit(1);
    }

    // 1. Find or create a site
    let site = await Site.findOne({ isActive: true });
    if (!site) {
      site = await Site.create({
        name: 'Hillview Residency',
        projectType: 'residential',
        location: { address: 'Plot 45, Baner', city: 'Pune', state: 'Maharashtra', pincode: '411045' },
        startDate: new Date(),
        expectedEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdBy: admin._id,
      });
    }

    // 2. Create standard materials
    const materialData = [
      { name: 'UltraTech Cement', category: 'cement', unit: 'Bags', currentStock: 450, minThreshold: 100, maxCapacity: 1000, unitCost: 380, emoji: '🏗' },
      { name: 'TATA Tiscon 550SD', category: 'steel', unit: 'Metric Tons', currentStock: 12, minThreshold: 5, maxCapacity: 50, unitCost: 65000, emoji: '⚙' },
      { name: 'Red Bricks (First Class)', category: 'bricks', unit: 'Units', currentStock: 15000, minThreshold: 5000, maxCapacity: 100000, unitCost: 8, emoji: '🧱' },
      { name: 'River Sand', category: 'sand', unit: 'Brass', currentStock: 4, minThreshold: 10, maxCapacity: 100, unitCost: 12000, emoji: '🟨' },
      { name: 'Crushed Metal (20mm)', category: 'aggregate', unit: 'Brass', currentStock: 25, minThreshold: 15, maxCapacity: 200, unitCost: 4500, emoji: '⬤' },
    ];

    for (const m of materialData) {
      await Material.findOneAndUpdate(
        { site: site._id, name: m.name },
        { ...m, site: site._id, createdBy: admin._id, isActive: true },
        { upsert: true, new: true }
      );
    }

    const savedMaterials = await Material.find({ site: site._id });

    // 3. Create Inventory Logs (History)
    console.log('📝 Creating inventory logs...');
    for (const mat of savedMaterials) {
      // Simulate 5-10 logs per material
      const numLogs = 5 + Math.floor(Math.random() * 5);
      for (let i = 0; i < numLogs; i++) {
        const type = Math.random() > 0.4 ? 'in' : 'out';
        const qty = type === 'in' ? 50 : 20;
        await InventoryLog.create({
          site: site._id,
          material: mat._id,
          loggedBy: admin._id,
          type,
          quantity: qty,
          balanceAfter: mat.currentStock,
          totalCost: qty * mat.unitCost,
          notes: `Mock ${type} entry`,
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        });
      }
    }

    // 4. Create Invoices
    console.log('🧾 Creating invoices...');
    const suppliers = ['Global Steels', 'Ambuja Logistics', 'Pioneer Electricals', 'Shiv Traders'];
    for (let i = 0; i < 8; i++) {
      const amount = 25000 + Math.floor(Math.random() * 50000);
      await Invoice.create({
        site: site._id,
        uploadedBy: admin._id,
        supplierName: suppliers[i % suppliers.length],
        amount,
        gst: amount * 0.18,
        invoiceNumber: `INV-2025-00${i}`,
        status: i < 3 ? 'approved' : i < 6 ? 'pending' : 'paid',
        invoiceDate: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000),
      });
    }

    console.log('✅ Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedMockData();
