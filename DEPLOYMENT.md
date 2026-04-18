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
   - `JWT_SECRET`: A secure random string.
   - `PORT`: `10000` (Render default).
   - `GOOGLE_VISION_API_KEY`: Required for Invoice OCR.
   - `OPENAI_API_KEY`: Required for AI Data Parsing.

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
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000`
6. **Environment Variables**:
   - `MONGO_URI`: Your MongoDB connection string.
   - `AI_SECRET_KEY`: Must match the backend `AI_SECRET_KEY`.
   - `PORT`: `10000`.

---

## 4. Final Inter-Connection
1. Go to your **Backend** settings in Render.
2. Set `AI_SERVICE_URL` to the URL of your deployed AI Service (e.g., `https://buildtrack-ai-ml.onrender.com`).
3. Go to your **Frontend** settings in Vercel.
4. Set `REACT_APP_API_URL` to your Backend URL.

## 📱 PWA Installation
Once deployed to Vercel (must be over HTTPS):
1. Open the site on your mobile browser (Safari for iOS, Chrome for Android).
2. Look for the **"Add to Home Screen"** option.
3. BuildTrack AI will now appear on your home screen with a custom logo and open in **standalone (APK-like) mode**.

## 🛠 Troubleshooting
- **CORS Issues**: Ensure the Vercel app URL is added to the backend's allowed origins in `server.js`.
- **SSL**: PWA Service Workers **only work over HTTPS** (which Vercel provides automatically).
