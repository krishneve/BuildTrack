"""
Anomaly Detection for Material Usage
Uses: Z-score on daily usage — flags days with usage > 2.5 std deviations from mean
"""

from fastapi import HTTPException
import numpy as np
from datetime import datetime, timedelta
from utils.db import get_db, oid, days_ago
from collections import defaultdict


def detect_anomalies(site_id: str, lookback_days: int = 30) -> dict:
    db  = get_db()
    sid = oid(site_id)
    if not sid:
        raise HTTPException(status_code=400, detail="Invalid siteId")

    since = days_ago(lookback_days)
    logs  = list(db["inventorylogs"].find({
        "site": sid,
        "type": "out",
        "createdAt": {"$gte": since},
    }).sort("createdAt", 1))

    if len(logs) < 5:
        return {
            "siteId":    site_id,
            "message":   "Not enough data for anomaly detection (need ≥5 records)",
            "anomalies": [],
            "totalLogs": len(logs),
        }

    # Group by material + day
    usage: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    for log in logs:
        mat = str(log["material"])
        day = log["createdAt"].strftime("%Y-%m-%d")
        usage[mat][day] += float(log.get("quantity", 0))

    # Fetch material names
    mat_ids  = [oid(m) for m in usage.keys()]
    mat_docs = {str(m["_id"]): m for m in db["materials"].find({"_id": {"$in": mat_ids}})}

    anomalies = []

    for mat_id, daily in usage.items():
        mat_doc   = mat_docs.get(mat_id, {})
        days_list = sorted(daily.keys())
        values    = np.array([daily[d] for d in days_list])

        if len(values) < 3:
            continue

        mean = float(np.mean(values))
        std  = float(np.std(values))

        if std == 0:
            continue

        z_scores = (values - mean) / std

        for i, (day, val, z) in enumerate(zip(days_list, values, z_scores)):
            if abs(z) > 2.5:
                severity = "critical" if abs(z) > 4.0 else ("high" if abs(z) > 3.0 else "medium")
                anomalies.append({
                    "materialId":   mat_id,
                    "materialName": mat_doc.get("name", "Unknown"),
                    "unit":         mat_doc.get("unit", ""),
                    "date":         day,
                    "quantity":     round(float(val),  2),
                    "avgQuantity":  round(mean, 2),
                    "zScore":       round(float(z), 2),
                    "severity":     severity,
                    "direction":    "spike" if z > 0 else "drop",
                    "description":  (
                        f"Usage of {round(float(val),1)} {mat_doc.get('unit','')} is "
                        f"{'significantly higher' if z > 0 else 'unexpectedly lower'} "
                        f"than the {lookback_days}-day average of {round(mean,1)} "
                        f"(z-score: {round(float(z),2)})"
                    ),
                })

    anomalies.sort(key=lambda a: abs(a["zScore"]), reverse=True)

    return {
        "siteId":       site_id,
        "lookbackDays": lookback_days,
        "totalLogs":    len(logs),
        "anomaliesFound": len(anomalies),
        "anomalies":    anomalies[:20],  # top 20
        "generatedAt":  datetime.utcnow().isoformat(),
    }
