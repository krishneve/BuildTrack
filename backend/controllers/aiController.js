const axios   = require('axios');
const fs      = require('fs');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { generateSimulatedInsights } = require('../services/aiInsightService');

const AI_URL    = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SECRET = process.env.AI_SECRET_KEY  || 'buildtrack_ai_secret_key_2025';

const aiHeaders = { 'x-api-key': AI_SECRET };

const proxyAI = async (res, endpoint, siteId) => {
  try {
    const { data } = await axios.get(`${AI_URL}${endpoint}`, { headers: aiHeaders, timeout: 5000 });
    return sendSuccess(res, data);
  } catch (err) {
    // Fallback to simulated insights
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

// GET /ai/dashboard/:siteId — all AI signals in one call
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
    return sendSuccess(res, {
      insights,
      aiStatus: 'simulated',
    });
  }
};

// POST /ai/detect-material
const detectMaterial = async (req, res) => {
  const { image } = req.body; // Base64 image
  
  if (!image) {
    return sendError(res, 'Image data is required', 400);
  }

  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    // Return Mock Response as requested
    return setTimeout(() => {
      sendSuccess(res, {
        materialName: "Cement",
        category: "Building Material",
        confidence: 0.90
      });
    }, 1500);
  }

  try {
    const base64Image = image.replace(/^data:image\/\w+;base64,/, "");
    const response = await axios.post(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      requests: [{
        image: { content: base64Image },
        features: [{ type: 'LABEL_DETECTION', maxResults: 10 }]
      }]
    });

    const labels = response.data.responses[0]?.labelAnnotations;
    if (!labels || labels.length === 0) {
      return sendError(res, 'Could not detect any materials in the image', 404);
    }

    const keywords = ['cement', 'brick', 'steel', 'sand', 'aggregate', 'wood', 'paint', 'plumbing', 'electrical', 'safety', 'concrete', 'iron'];
    let detected = null;

    for (const label of labels) {
      const desc = label.description.toLowerCase();
      const match = keywords.find(k => desc.includes(k));
      if (match) {
        detected = {
          materialName: match.charAt(0).toUpperCase() + match.slice(1),
          category: ['sand', 'aggregate', 'brick', 'cement', 'concrete'].includes(match) ? 'Building Material' : 'Construction Material',
          confidence: label.score
        };
        break;
      }
    }

    if (!detected) {
      detected = {
        materialName: labels[0].description,
        category: 'Other',
        confidence: labels[0].score
      };
    }

    return sendSuccess(res, detected);
  } catch (err) {
    console.error("AI Detection Error:", err.response?.data || err.message);
    return sendError(res, 'AI Detection failed. Please try again or enter manually.', 500);
  }
};

// POST /ai/extract-invoice
const extractInvoice = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'Invoice file is required', 400);
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    const gptKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Mock Data as requested
      return setTimeout(() => {
        sendSuccess(res, {
          supplierName: "Shree Cement Traders",
          invoiceNumber: "INV-5678",
          date: new Date().toISOString().split('T')[0],
          totalAmount: 18000,
          confidence: 0.95
        });
      }, 2000);
    }

    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');

    // 1. OCR via Google Vision
    const visionRes = await axios.post(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      requests: [{
        image: { content: base64Image },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
      }]
    });

    const fullText = visionRes.data.responses[0]?.fullTextAnnotation?.text;
    if (!fullText) {
      return sendError(res, 'No text could be extracted from this document', 422);
    }

    let extractedData = {
      supplierName: '',
      invoiceNumber: '',
      date: '',
      totalAmount: 0,
      confidence: 0.8
    };

    // 2. Structure Data
    if (gptKey) {
      try {
        const gptRes = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: "gpt-4-turbo-preview",
          messages: [
            { role: "system", content: "Extract structured invoice data from text. Return ONLY valid JSON with keys: supplierName, invoiceNumber, date (YYYY-MM-DD), totalAmount (number)." },
            { role: "user", content: fullText }
          ],
          response_format: { type: "json_object" }
        }, { headers: { Authorization: `Bearer ${gptKey}` } });

        const gptData = JSON.parse(gptRes.data.choices[0].message.content);
        extractedData = { ...extractedData, ...gptData };
      } catch (gptErr) {
        console.error("GPT Extraction failed");
      }
    }

    // 3. Fallback logic
    if (!extractedData.supplierName) {
      const amountMatch = fullText.match(/(?:Total|Amount|Balance|Net|Gross).?\D?(\d{2,}(?:[.,]\d{2})?)/i);
      if (amountMatch) extractedData.totalAmount = parseFloat(amountMatch[1].replace(',', ''));
      const dateMatch = fullText.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/);
      if (dateMatch) extractedData.date = dateMatch[0];
      const invMatch = fullText.match(/(?:Inv|Invoice|Bill|Ref).?\s?#?\s?([A-Z0-9-]{3,})/i);
      if (invMatch) extractedData.invoiceNumber = invMatch[1];
      extractedData.supplierName = fullText.split('\n')[0].trim();
    }

    return sendSuccess(res, extractedData);
  } catch (err) {
    console.error("Invoice Extraction Error:", err.message);
    return sendError(res, 'Internal server error during invoice processing', 500);
  } finally {
    // Cleanup uploaded file
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
  }
};

module.exports = { predictMaterial, costOverrun, anomalyDetection, smartAlerts, aiDashboard, detectMaterial, extractInvoice };
