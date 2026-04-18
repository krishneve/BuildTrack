const axios   = require('axios');
const fs      = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { generateSimulatedInsights } = require('../services/aiInsightService');

const AI_URL    = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SECRET = process.env.AI_SECRET_KEY  || 'buildtrack_ai_secret_key_2025';
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// Initialize Gemini
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;
const aiHeaders = { 'x-api-key': AI_SECRET };

const proxyAI = async (res, endpoint, siteId) => {
  try {
    const { data } = await axios.get(`${AI_URL}${endpoint}`, { headers: aiHeaders, timeout: 5000 });
    return sendSuccess(res, data);
  } catch (err) {
    const insights = await generateSimulatedInsights(siteId);
    return sendSuccess(res, { insights, aiStatus: 'simulated', originalError: err.message });
  }
};

// GET /ai/predict-material/:siteId
const predictMaterial = (req, res) =>
  proxyAI(res, `/ai/predict-material/${req.params.siteId}`, req.params.siteId);

// GET /ai/cost-overrun/:siteId
const costOverrun = (req, res) =>
  proxyAI(res, `/ai/cost-overrun/${req.params.siteId}`, req.params.siteId);

// GET /ai/anomaly/:siteId
const anomalyDetection = (req, res) =>
  proxyAI(res, `/ai/anomaly/${req.params.siteId}?days=${req.query.days || 30}`, req.params.siteId);

// GET /ai/smart-alerts/:siteId
const smartAlerts = (req, res) =>
  proxyAI(res, `/ai/smart-alerts/${req.params.siteId}`, req.params.siteId);

// GET /ai/dashboard/:siteId
const aiDashboard = async (req, res) => {
  const { siteId } = req.params;
  try {
    const [alerts, cost, forecast] = await Promise.allSettled([
      axios.get(`${AI_URL}/ai/smart-alerts/${siteId}`,    { headers: aiHeaders, timeout: 5000 }),
      axios.get(`${AI_URL}/ai/cost-overrun/${siteId}`,    { headers: aiHeaders, timeout: 5000 }),
      axios.get(`${AI_URL}/ai/predict-material/${siteId}`,{ headers: aiHeaders, timeout: 5000 }),
    ]);

    if (alerts.status === 'fulfilled') {
      return sendSuccess(res, {
        alerts:   alerts.value.data,
        costRisk: cost.status     === 'fulfilled' ? cost.value.data     : null,
        forecast: forecast.status === 'fulfilled' ? forecast.value.data : null,
        aiStatus: 'online',
      });
    } else {
      throw new Error('AI Service Offline');
    }
  } catch (err) {
    const insights = await generateSimulatedInsights(siteId);
    return sendSuccess(res, { insights, aiStatus: 'simulated' });
  }
};

// POST /ai/detect-material
const detectMaterial = async (req, res) => {
  const { image } = req.body;
  if (!image) return sendError(res, 'Image data is required', 400);

  if (!genAI) {
    return setTimeout(() => {
      sendSuccess(res, { materialName: "Cement", category: "Building Material", confidence: 0.90 });
    }, 1500);
  }

  try {
    const base64Image = image.replace(/^data:image\/\w+;base64,/, "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Identify the main construction material in this image. Return ONLY a JSON object with keys: materialName, category, and confidence (0-1).";

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
    ]);

    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    return sendSuccess(res, JSON.parse(text));
  } catch (err) {
    console.error("Gemini Detection Error:", err.message);
    return sendError(res, 'AI Detection failed. Please try again.', 500);
  }
};

// POST /ai/extract-invoice
const extractInvoice = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 'Invoice file is required', 400);

    if (!genAI) {
      return setTimeout(() => {
        sendSuccess(res, { supplierName: "Mock Supplier", invoiceNumber: "INV-001", date: "2024-04-18", totalAmount: 5000, confidence: 0.95 });
      }, 2000);
    }

    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Extract structured invoice data from this image. Return ONLY a valid JSON object with keys: supplierName, invoiceNumber, date (YYYY-MM-DD), totalAmount (number). Use 0 if a value is missing.";

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
    ]);

    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    const data = JSON.parse(text);
    data.confidence = 0.98;

    return sendSuccess(res, data);
  } catch (err) {
    console.error("Gemini Extraction Error:", err.message);
    return sendError(res, 'AI Extraction failed. Please try again.', 500);
  } finally {
    if (req.file) fs.unlink(req.file.path, () => {});
  }
};

module.exports = { predictMaterial, costOverrun, anomalyDetection, smartAlerts, aiDashboard, detectMaterial, extractInvoice };
