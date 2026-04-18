"""
Material Demand Forecasting
Uses: 7-day rolling average + linear regression trend
Returns per-material prediction for next 7 days
"""

from fastapi import HTTPException
import numpy as np
from datetime import datetime, timedelta
from utils.db import get_db, oid, days_ago
from collections import defaultdict


def predict_material_demand(site_id: str) -> dict:
    db = get_db()
    sid = oid(site_id)
    if not sid:
        raise HTTPException(status_code=400, detail="Invalid siteId")

    # Fetch last 30 days of OUT logs (usage = what was consumed)
    since = days_ago(30)
    logs = list(db["inventorylogs"].find({
        "site": sid,
        "type": "out",
        "createdAt": {"$gte": since},
    }).sort("createdAt", 1))

    if not logs:
        raise HTTPException(status_code=404, detail="Insufficient data — need at least 7 days of material usage")

    # Group daily usage per material
    material_ids = list({str(log["material"]) for log in logs})
    daily_usage: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))

    for log in logs:
        day = log["createdAt"].strftime("%Y-%m-%d")
        mat = str(log["material"])
        daily_usage[mat][day] += float(log.get("quantity", 0))

    # Fetch material names
    mat_docs = {
        str(m["_id"]): m
        for m in db["materials"].find({"_id": {"$in": [oid(m) for m in material_ids]}})
    }

    predictions = []
    today = datetime.utcnow().date()

    for mat_id, daily in daily_usage.items():
        mat_doc = mat_docs.get(mat_id, {})

        # Build time series: last 30 days
        dates   = [(today - timedelta(days=i)) for i in range(29, -1, -1)]
        y_vals  = np.array([daily.get(d.strftime("%Y-%m-%d"), 0.0) for d in dates])

        # Simple 7-day rolling avg
        rolling_avg = float(np.mean(y_vals[-7:])) if np.any(y_vals[-7:] > 0) else 0.0

        # Linear regression over last 14 days for trend
        x_vals = np.arange(len(y_vals[-14:]))
        y14    = y_vals[-14:]
        if len(x_vals) >= 3 and np.std(y14) > 0:
            coeffs = np.polyfit(x_vals, y14, 1)
            slope  = float(coeffs[0])
        else:
            slope = 0.0

        # Project next 7 days
        next_7_days = []
        for i in range(1, 8):
            proj = max(0.0, rolling_avg + slope * i)
            next_7_days.append({
                "date": (today + timedelta(days=i)).isoformat(),
                "predicted": round(proj, 2),
            })

        total_predicted = round(sum(d["predicted"] for d in next_7_days), 2)
        current_stock   = float(mat_doc.get("currentStock", 0))
        min_threshold   = float(mat_doc.get("minThreshold", 0))
        days_remaining  = round(current_stock / rolling_avg, 1) if rolling_avg > 0 else 999

        risk = "low"
        if days_remaining <= 3:
            risk = "critical"
        elif days_remaining <= 7:
            risk = "high"
        elif days_remaining <= 14:
            risk = "medium"

        predictions.append({
            "materialId":     mat_id,
            "materialName":   mat_doc.get("name", "Unknown"),
            "unit":           mat_doc.get("unit", ""),
            "currentStock":   current_stock,
            "minThreshold":   min_threshold,
            "avgDailyUsage":  round(rolling_avg, 2),
            "trend":          "increasing" if slope > 0.1 else ("decreasing" if slope < -0.1 else "stable"),
            "daysOfStockLeft": days_remaining,
            "stockRisk":       risk,
            "next7Days":       next_7_days,
            "totalPredicted7d": total_predicted,
            "willRunLow":      (current_stock - total_predicted) < min_threshold,
        })

    # Sort by risk severity
    risk_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    predictions.sort(key=lambda p: risk_order.get(p["stockRisk"], 4))

    return {
        "siteId":        site_id,
        "daysAnalysed":  30,
        "totalMaterials": len(predictions),
        "predictions":   predictions,
        "generatedAt":   datetime.utcnow().isoformat(),
    }
