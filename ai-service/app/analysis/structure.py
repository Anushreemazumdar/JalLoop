def structure_report(payload) -> dict:
    text = payload.description.lower()
    guessed = payload.category
    if guessed is None:
        if "leak" in text or "burst" in text:
            guessed = "PIPE_LEAK"
        elif "waterlog" in text or "flood" in text or "logged" in text:
            guessed = "WATERLOGGING"
        elif "drain" in text or "clog" in text:
            guessed = "BLOCKED_DRAIN"
        elif "shortage" in text or "tanker" in text or "no water" in text:
            guessed = "WATER_SHORTAGE"
        else:
            guessed = "OTHER"
    return {
        "suggestedCategory": guessed,
        "kind": "AI_SUGGESTION",
        "humanReviewRequired": True,
        "extractedClaims": [payload.description[:400]],
        "note": "Category suggestion is advisory. The reporter-supplied category remains authoritative unless reviewed.",
    }
