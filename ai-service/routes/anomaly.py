from fastapi import APIRouter, Header, HTTPException, Query
from services.anomaly import detect_anomalies
import os

router = APIRouter()
SECRET = os.getenv("AI_SECRET_KEY", "buildtrack_ai_secret_key_2025")

def auth(x_api_key: str = Header(default=None)):
    if x_api_key != SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.get("/anomaly/{site_id}")
def anomaly_detection(
    site_id: str,
    days: int = Query(default=30, ge=7, le=90),
    x_api_key: str = Header(default=None),
):
    auth(x_api_key)
    return detect_anomalies(site_id, lookback_days=days)
