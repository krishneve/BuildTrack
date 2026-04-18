# BuildTrack AI - Deployment Guide

This guide outlines the steps to deploy BuildTrack AI as a production-ready Progressive Web App (PWA).

## 🚀 Deployment Platforms
- **Frontend**: [Vercel](https://vercel.com) (Recommended for React PWAs)
- **Backend**: [Render](https://render.com) (Recommended for Node.js/Express)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas)

---

## 1. Backend Setup (Render)
1. **Create Web Service**: Connect your GitHub repository.
2. **Root Directory**: `backend`
3. **Build Command**: `npm install`
4. **Start Command**: `node server.js`
5. **Environment Variables**:
   - `MONGODB_URI`: Your MongoDB connection string.
   - `JWT_SECRET`: A secure random string for tokens.
   - `GEMINI_API_KEY`: Required for **Free AI OCR and Material Detection** ([Get one here](https://aistudio.google.com)).
   - `PORT`: `10000` (Render default).

---

## 2. Frontend Setup (Vercel)
1. **Create Project**: Connect your GitHub repository.
2. **Root Directory**: `frontend`
3. **Framework Preset**: `Create React App`
4. **Build Command**: `npm run build`
5. **Output Directory**: `build`
6. **Environment Variables**:
   - `REACT_APP_API_URL`: The URL of your deployed Render backend (e.g., `https://buildtrack-api.onrender.com/api/v1`).

---

## 3. AI Microservice Setup (Render)
1. **Create Web Service**: Connect your GitHub repository.
2. **Root Directory**: `ai-service`
3. **Runtime**: `Python`
4. **Build Command**: `pip install -r requirements.txt` (Make sure your Render Environment is set to Python 3.9+)
5. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000`
6. **Environment Variables**:
   - `MONGO_URI`: Your MongoDB connection string.
   - `AI_SECRET_KEY`: Must match the backend `AI_SECRET_KEY`.
   - `PORT`: `10000`.

---

## 4. Final Inter-Connection
1. Go to your **Backend** settings in Render.
2. Set `AI_SERVICE_URL` to the URL of your deployed AI Service (e.g., `https://buildtrack-ai-ml.onrender.com`).
3. Set `GEMINI_API_KEY` to your free key from Google AI Studio.

## 📱 PWA Installation
Once deployed to Vercel:
1. Open the site on your mobile phone browser.
2. Select **"Add to Home Screen"**.
3. The app will now launch in **Standalone Mode** (just like an APK) and work offline using Service Workers.

## 🛠 Troubleshooting
- **CORS**: Ensure the Vercel app URL is added to the backend's allowed origins.
- **SSL**: PWA Service Workers **require HTTPS** (Vercel handles this automatically).
