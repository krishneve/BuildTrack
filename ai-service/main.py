#!/usr/bin/env python3
"""
BuildTrack AI — AI Microservice
Provides: material demand forecasting, cost overrun detection, anomaly detection
"""

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

from routes.predict import router as predict_router
from routes.anomaly import router as anomaly_router
from routes.alerts  import router as alerts_router

app = FastAPI(
    title="BuildTrack AI — AI Service",
    description="ML-powered insights for construction management",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth guard ────────────────────────────────────────────────────────────────
AI_SECRET = os.getenv("AI_SECRET_KEY", "buildtrack_ai_secret_key_2025")

def verify_api_key(x_api_key: str = Header(default=None)):
    if x_api_key != AI_SECRET:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

app.include_router(predict_router, prefix="/ai", tags=["Predictions"])
app.include_router(anomaly_router, prefix="/ai", tags=["Anomaly Detection"])
app.include_router(alerts_router,  prefix="/ai", tags=["Smart Alerts"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "BuildTrack AI Service", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
