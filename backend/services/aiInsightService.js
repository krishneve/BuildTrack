const Material = require('../models/Material');
const InventoryLog = require('../models/InventoryLog');
const Invoice = require('../models/Invoice');
const Site = require('../models/Site');

const generateSimulatedInsights = async (siteId) => {
  try {
    const [materials, logs, invoices] = await Promise.all([
      Material.find({ site: siteId, isActive: true }).lean(),
      InventoryLog.find({ site: siteId }).sort({ createdAt: -1 }).limit(100).lean(),
      Invoice.find({ site: siteId }).sort({ createdAt: -1 }).lean(),
    ]);

    const insights = [];

    // 1. Material Anomaly (Sudden Spikes)
    const recentLogs = logs.slice(0, 20);
    const spikes = [];
    materials.forEach(mat => {
      const matLogs = recentLogs.filter(l => l.material.toString() === mat._id.toString() && l.type === 'out');
      if (matLogs.length > 0) {
        const avg = matLogs.reduce((a, b) => a + b.quantity, 0) / matLogs.length;
        const lastLog = matLogs[0];
        if (lastLog.quantity > avg * 2) {
          spikes.push({
            type: 'anomaly',
            severity: 'medium',
            title: `Unusual usage: ${mat.name}`,
            message: `Latest withdrawal of ${lastLog.quantity} ${mat.unit} is significantly higher than daily average.`,
            emoji: '⚠️'
          });
        }
      }
    });
    insights.push(...spikes);

    // 2. Predictive Insights (Stock Out Forecast)
    const forecasts = [];
    materials.forEach(mat => {
      if (mat.currentStock <= mat.minThreshold) {
        forecasts.push({
          type: 'prediction',
          severity: 'high',
          title: `Stock-out imminent: ${mat.name}`,
          message: `At current usage rates, ${mat.name} will be completely exhausted in approximately 3 days.`,
          emoji: '📉'
        });
      }
    });
    insights.push(...forecasts);

    // 3. Efficiency Insights
    const approvedInvoices = invoices.filter(i => i.status === 'approved' || i.status === 'paid');
    const totalSpent = approvedInvoices.reduce((a, b) => a + b.totalAmount, 0);
    if (totalSpent > 1000000) {
        insights.push({
            type: 'efficiency',
            severity: 'low',
            title: 'Cost Optimization Opportunity',
            message: 'Bulk procurement of cement could reduce unit costs by 5-8% based on recent volume.',
            emoji: '💡'
        });
    }

    // 4. Smart Alerts
    if (logs.filter(l => l.type === 'out').length > 50) {
        insights.push({
            type: 'alert',
            severity: 'info',
            title: 'Inventory Heatmap',
            message: 'High movement detected in masonry category. Suggest reviewing site security logs.',
            emoji: '🔍'
        });
    }

    return insights.length > 0 ? insights : [{
        type: 'status',
        severity: 'low',
        title: 'Operations Stable',
        message: 'AI models indicate normal operational patterns across all verticals.',
        emoji: '✅'
    }];
  } catch (err) {
    console.error('Insight generation failed:', err);
    return [];
  }
};

module.exports = { generateSimulatedInsights };
