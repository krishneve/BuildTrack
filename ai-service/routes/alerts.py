"""
Smart Alerts — combines rule-based + AI signals into actionable alerts
"""
from fastapi import APIRouter, Header, HTTPException
from services.forecasting import predict_material_demand
from services.cost_analysis import detect_cost_overrun
from services.anomaly import detect_anomalies
from utils.db import get_db, oid, days_ago
from datetime import datetime
import os

router = APIRouter()
SECRET = os.getenv("AI_SECRET_KEY", "buildtrack_ai_secret_key_2025")

def auth(x_api_key: str = Header(default=None)):
    if x_api_key != SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.get("/smart-alerts/{site_id}")
def smart_alerts(site_id: str, x_api_key: str = Header(default=None)):
    auth(x_api_key)
    alerts = []

    # ── 1. Budget / Cost risk ─────────────────────────────────────────────────
    try:
        cost = detect_cost_overrun(site_id)
        if "riskLevel" in cost:
            severity_map = {"critical": "critical", "high": "high", "medium": "medium", "low": "info"}
            if cost["riskLevel"] in ("critical", "high", "medium"):
                alerts.append({
                    "type":     "budget_risk",
                    "severity": severity_map.get(cost["riskLevel"], "info"),
                    "title":    f"Budget {cost['riskLevel'].upper()} Risk",
                    "message":  cost["reasons"][0] if cost.get("reasons") else "Budget monitoring required",
                    "data":     {"pctConsumed": cost["budget"]["pctConsumed"], "riskLevel": cost["riskLevel"]},
                })
    except Exception:
        pass

    # ── 2. Low stock + demand ─────────────────────────────────────────────────
    try:
        forecast = predict_material_demand(site_id)
        for pred in forecast.get("predictions", []):
            if pred["stockRisk"] in ("critical", "high"):
                alerts.append({
                    "type":     "low_stock",
                    "severity": pred["stockRisk"],
                    "title":    f"Low Stock: {pred['materialName']}",
                    "message":  (
                        f"Only {pred['daysOfStockLeft']} days of {pred['materialName']} remaining. "
                        f"Predicted to run out on {pred['next7Days'][-1]['date'] if pred.get('next7Days') else 'soon'}."
                    ),
                    "data": {
                        "materialId":   pred["materialId"],
                        "currentStock": pred["currentStock"],
                        "daysLeft":     pred["daysOfStockLeft"],
                    },
                })
    except Exception:
        pass

    # ── 3. Anomalies ──────────────────────────────────────────────────────────
    try:
        anom = detect_anomalies(site_id, lookback_days=14)
        for a in anom.get("anomalies", [])[:3]:  # top 3 recent
            if a["severity"] in ("critical", "high"):
                alerts.append({
                    "type":     "usage_anomaly",
                    "severity": a["severity"],
                    "title":    f"Unusual Usage: {a['materialName']}",
                    "message":  a["description"],
                    "data": {
                        "materialId": a["materialId"],
                        "date":       a["date"],
                        "zScore":     a["zScore"],
                    },
                })
    except Exception:
        pass

    # ── 4. Rule-based: pending approvals ─────────────────────────────────────
    try:
        db  = get_db()
        sid = oid(site_id)
        pending_att  = db["attendances"].count_documents({"site": sid, "status": "pending"})
        pending_inv  = db["invoices"].count_documents({"site": sid, "status": "pending"})
        pending_pay  = db["payments"].count_documents({"site": sid, "status": "pending"})

        if pending_att > 5:
            alerts.append({
                "type": "pending_approvals", "severity": "medium",
                "title": f"{pending_att} Attendance Records Pending",
                "message": f"{pending_att} attendance records awaiting manager approval.",
                "data": {"count": pending_att, "module": "attendance"},
            })
        if pending_inv > 3:
            alerts.append({
                "type": "pending_approvals", "severity": "medium",
                "title": f"{pending_inv} Invoices Pending Review",
                "message": f"{pending_inv} invoices awaiting approval.",
                "data": {"count": pending_inv, "module": "invoices"},
            })
    except Exception:
        pass

    # Sort by severity
    sev_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
    alerts.sort(key=lambda a: sev_order.get(a["severity"], 5))

    return {
        "siteId":      site_id,
        "totalAlerts": len(alerts),
        "critical":    sum(1 for a in alerts if a["severity"] == "critical"),
        "high":        sum(1 for a in alerts if a["severity"] == "high"),
        "medium":      sum(1 for a in alerts if a["severity"] == "medium"),
        "alerts":      alerts,
        "generatedAt": datetime.utcnow().isoformat(),
    }
