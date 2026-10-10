from datetime import datetime, timezone


def prioritize(payload) -> dict:
    severity_map = {"LOW": 0.25, "MODERATE": 0.5, "HIGH": 0.75, "CRITICAL": 1.0}
    missing = []
    severity_weight = severity_map.get(payload.severity.upper(), 0.4)
    if payload.severity.upper() not in severity_map:
        missing.append("Unrecognised severity; defaulted to 0.4")
    demand_weight = 0.0
    if payload.estimatedAffectedDemandM3PerDay is None:
        missing.append("estimatedAffectedDemandM3PerDay not supplied")
    else:
        demand_weight = min(1.0, payload.estimatedAffectedDemandM3PerDay / 50.0)
    urgency = 0.0
    if not payload.observedAt:
        missing.append("observedAt not supplied")
    else:
        try:
            observed = datetime.fromisoformat(payload.observedAt.replace("Z", "+00:00"))
            hours = max(0.0, (datetime.now(timezone.utc) - observed.astimezone(timezone.utc)).total_seconds() / 3600.0)
            urgency = min(1.0, hours / 72.0)
        except ValueError:
            missing.append("observedAt could not be parsed")
    score = round(0.5 * severity_weight + 0.3 * demand_weight + 0.2 * urgency, 3)
    band = "HIGH" if score >= 0.75 else "MEDIUM" if score >= 0.45 else "LOW"
    return {
        "heuristicPriorityScore": score,
        "heuristicPriorityBand": band,
        "missingInformation": missing,
        "availableWaterInvented": False,
        "note": "This ranking does not claim recovered water can meet the shortage.",
        "kind": "CALCULATED_ESTIMATE",
    }
