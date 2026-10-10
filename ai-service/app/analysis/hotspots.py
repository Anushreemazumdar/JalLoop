def analyze(payload) -> dict:
    incidents = payload.incidents or []
    unresolved = [i for i in incidents if str(i.get("status", "")).upper() not in {"RESOLVED", "VERIFIED", "REJECTED_DUPLICATE"}]
    score = 0.0
    if incidents:
        score = 0.5 * min(1.0, len(incidents) / 5.0) + 0.5 * (len(unresolved) / len(incidents))
    return {
        "heuristicScore": round(score, 3),
        "incidentCount": len(incidents),
        "unresolvedCount": len(unresolved),
        "hotspotCountHint": payload.hotspotCount,
        "weights": {"recurrence": 0.5, "unresolvedShare": 0.5},
        "label": "Heuristic recurrence score, not a scientifically validated prediction",
        "kind": "CALCULATED_ESTIMATE",
    }
