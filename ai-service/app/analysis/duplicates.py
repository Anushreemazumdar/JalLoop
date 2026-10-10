import math
from difflib import SequenceMatcher


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def find_candidates(payload) -> dict:
    results = []
    for candidate in payload.candidates:
        reasons = []
        lat = float(candidate.get("latitude", 0))
        lon = float(candidate.get("longitude", 0))
        distance = haversine_m(payload.latitude, payload.longitude, lat, lon)
        if distance <= 150:
            reasons.append(f"within {round(distance, 1)} m")
        if str(candidate.get("category", "")).upper() == payload.category.upper():
            reasons.append("same category")
        text = str(candidate.get("description") or candidate.get("summary") or "")
        similarity = SequenceMatcher(None, payload.description.lower(), text.lower()).ratio()
        if similarity >= 0.45:
            reasons.append(f"text similarity {round(similarity, 2)}")
        if reasons:
            results.append(
                {
                    "id": candidate.get("id"),
                    "reasons": reasons,
                    "distanceMeters": round(distance, 1),
                    "textSimilarity": round(similarity, 3),
                    "identical": False,
                    "requiresHumanReview": True,
                }
            )
    return {
        "candidates": results,
        "autoMerged": False,
        "note": "Candidates are not declared identical. Human review is required.",
    }
