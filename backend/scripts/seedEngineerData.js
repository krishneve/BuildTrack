const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Site = require('../models/Site');
const Material = require('../models/Material');
const InventoryLog = require('../models/InventoryLog');
const Invoice = require('../models/Invoice');
const Attendance = require('../models/Attendance');

async function seedData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const engineer = await User.findOne({ role: 'site_engineer' });
        const site = await Site.findOne({});

        if (!engineer || !site) {
            console.error('Engineer or Site not found');
            process.exit(1);
        }

        console.log(`Seeding data for Engineer: ${engineer.name} at Site: ${site.name}`);

        // Update engineer's primary site
        engineer.primarySite = site._id;
        await engineer.save();

        // 1. Add Materials
        const materials = [
            { name: 'UltraTech Cement', category: 'cement', unit: 'bags', minThreshold: 100, maxCapacity: 1000, currentStock: 450, unitCost: 450, site: site._id, emoji: '🏗' },
            { name: 'TATA Tiscon TMT', category: 'steel', unit: 'tonnes', minThreshold: 5, maxCapacity: 50, currentStock: 12.5, unitCost: 65000, site: site._id, emoji: '⚙' },
            { name: 'Red Bricks Class-A', category: 'bricks', unit: 'pcs', minThreshold: 5000, maxCapacity: 50000, currentStock: 18000, unitCost: 8, site: site._id, emoji: '🧱' },
            { name: 'River Sand', category: 'sand', unit: 'sqft', minThreshold: 200, maxCapacity: 2000, currentStock: 850, unitCost: 60, site: site._id, emoji: '🟨' },
        ];

        for (const m of materials) {
            await Material.findOneAndUpdate({ name: m.name, site: site._id }, m, { upsert: true });
        }

        const seededMaterials = await Material.find({ site: site._id });

        // 2. Add Inventory Logs (Intake & Usage)
        const logs = [
            { material: seededMaterials[0]._id, site: site._id, loggedBy: engineer._id, type: 'in', quantity: 200, balanceAfter: 450, notes: 'Morning batch intake' },
            { material: seededMaterials[1]._id, site: site._id, loggedBy: engineer._id, type: 'out', quantity: 2, balanceAfter: 12.5, notes: 'Column casting 4th floor' },
            { material: seededMaterials[2]._id, site: site._id, loggedBy: engineer._id, type: 'in', quantity: 5000, balanceAfter: 18000, notes: 'Truck arrival' },
        ];

        for (const l of logs) {
            await InventoryLog.create(l);
        }

        // 3. Add Invoices
        const invoices = [
            { supplierName: 'Agrawal Cement Agency', site: site._id, uploadedBy: engineer._id, amount: 90000, gst: 16200, status: 'approved', invoiceDate: new Date(), category: 'materials' },
            { supplierName: 'Sheetal Steel Corp', site: site._id, uploadedBy: engineer._id, amount: 130000, gst: 23400, status: 'pending', invoiceDate: new Date(), category: 'materials' },
        ];

        for (const inv of invoices) {
            await Invoice.create(inv);
        }

        // 4. Add Attendance for today
        const today = new Date();
        const start = new Date(today.setHours(0, 0, 0, 0));
        await Attendance.create({ worker: engineer._id, site: site._id, type: 'in', date: start, status: 'approved' });

        console.log('Seeding completed successfully');
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedData();
