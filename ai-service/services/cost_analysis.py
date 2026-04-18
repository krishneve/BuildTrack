"""
Cost Overrun Detection
Analyses spending velocity vs budget to predict overrun risk
"""

from fastapi import HTTPException
import numpy as np
from datetime import datetime, timedelta
from utils.db import get_db, oid, days_ago


def detect_cost_overrun(site_id: str) -> dict:
    db  = get_db()
    sid = oid(site_id)
    if not sid:
        raise HTTPException(status_code=400, detail="Invalid siteId")

    # Get budget
    budget = db["budgets"].find_one({"site": sid})
    site   = db["sites"].find_one({"_id": sid})

    if not budget:
        raise HTTPException(status_code=404, detail="No budget found for this site")

    total_budget = float(budget.get("totalBudget", 0))
    total_spent  = float(budget.get("totalSpent",  0))

    if total_budget <= 0:
        raise HTTPException(status_code=400, detail="Budget limit not set or zero")

    pct_consumed = (total_spent / total_budget) * 100

    # ── Spending velocity: last 30 days ──────────────────────────────────────
    since_30 = days_ago(30)
    since_7  = days_ago(7)

    payments_30 = list(db["payments"].find({
        "site": sid,
        "status": {"$in": ["approved", "paid"]},
        "createdAt": {"$gte": since_30},
    }))
    payments_7 = list(db["payments"].find({
        "site": sid,
        "status": {"$in": ["approved", "paid"]},
        "createdAt": {"$gte": since_7},
    }))

    spend_30d = sum(float(p.get("amount", 0)) for p in payments_30)
    spend_7d  = sum(float(p.get("amount", 0)) for p in payments_7)

    daily_rate_30 = spend_30d / 30 if spend_30d else 0
    daily_rate_7  = spend_7d  / 7  if spend_7d  else 0

    # ── Project future spend ─────────────────────────────────────────────────
    start_date    = site.get("startDate",       datetime.utcnow()) if site else datetime.utcnow()
    expected_end  = site.get("expectedEndDate", datetime.utcnow() + timedelta(days=180)) if site else datetime.utcnow() + timedelta(days=180)
    days_elapsed  = max(1, (datetime.utcnow() - start_date).days)
    days_remaining = max(1, (expected_end - datetime.utcnow()).days)

    projected_total = total_spent + (daily_rate_7 * days_remaining)
    projected_overrun_pct = ((projected_total - total_budget) / total_budget * 100) if total_budget else 0

    # ── Velocity change (acceleration) ──────────────────────────────────────
    velocity_ratio = (daily_rate_7 / daily_rate_30) if daily_rate_30 > 0 else 1.0
    acceleration   = "accelerating" if velocity_ratio > 1.3 else ("decelerating" if velocity_ratio < 0.7 else "stable")

    # ── Risk level ────────────────────────────────────────────────────────────
    risk = "low"
    reasons = []

    if pct_consumed >= 100:
        risk = "critical"
        reasons.append(f"Budget already exceeded ({pct_consumed:.1f}% consumed)")
    elif pct_consumed >= 90:
        risk = "high"
        reasons.append(f"Budget 90% consumed ({pct_consumed:.1f}%)")
    elif projected_overrun_pct > 15:
        risk = "high"
        reasons.append(f"Projected to overrun by {projected_overrun_pct:.1f}% at current rate")
    elif pct_consumed >= 75 or projected_overrun_pct > 5:
        risk = "medium"
        reasons.append(f"Budget at {pct_consumed:.1f}% — monitoring recommended")
    else:
        reasons.append("Spending within normal range")

    if acceleration == "accelerating" and risk in ("medium", "low"):
        risk = "medium" if risk == "low" else risk
        reasons.append(f"Spending velocity increased {velocity_ratio:.1f}x in last 7 days")

    # ── Build timeline ────────────────────────────────────────────────────────
    budget_run_out_days = int((total_budget - total_spent) / daily_rate_7) if daily_rate_7 > 0 else 999
    budget_exhaustion_date = (datetime.utcnow() + timedelta(days=budget_run_out_days)).date().isoformat()         if budget_run_out_days < 365 else None

    return {
        "siteId":         site_id,
        "siteName":       site.get("name", "Unknown") if site else "Unknown",
        "riskLevel":      risk,
        "reasons":        reasons,
        "budget": {
            "total":     total_budget,
            "spent":     total_spent,
            "remaining": total_budget - total_spent,
            "pctConsumed": round(pct_consumed, 1),
        },
        "spending": {
            "last30Days":        round(spend_30d, 2),
            "last7Days":         round(spend_7d,  2),
            "dailyRate30d":      round(daily_rate_30, 2),
            "dailyRate7d":       round(daily_rate_7,  2),
            "acceleration":      acceleration,
            "velocityRatio":     round(velocity_ratio, 2),
        },
        "projections": {
            "projectedTotal":      round(projected_total,        2),
            "projectedOverrunPct": round(projected_overrun_pct,  1),
            "daysRemaining":       days_remaining,
            "budgetExhaustionDate": budget_exhaustion_date,
        },
        "generatedAt": datetime.utcnow().isoformat(),
    }
