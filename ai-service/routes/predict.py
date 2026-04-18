from fastapi import APIRouter, Header, HTTPException
from services.forecasting import predict_material_demand
from services.cost_analysis import detect_cost_overrun
import os

router = APIRouter()
SECRET = os.getenv("AI_SECRET_KEY", "buildtrack_ai_secret_key_2025")

def auth(x_api_key: str = Header(default=None)):
    if x_api_key != SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.get("/predict-material/{site_id}")
def predict_material(site_id: str, x_api_key: str = Header(default=None)):
    auth(x_api_key)
    return predict_material_demand(site_id)

@router.get("/cost-overrun/{site_id}")
def cost_overrun(site_id: str, x_api_key: str = Header(default=None)):
    auth(x_api_key)
    return detect_cost_overrun(site_id)
