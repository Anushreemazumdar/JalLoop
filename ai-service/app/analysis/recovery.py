from app.analysis.runoff import estimate

UNSAFE_FLAGS = {"ROAD_RUNOFF", "INDOOR_FLOODWATER"}


def assess(payload) -> dict:
    runoff = estimate(payload)
    flag = payload.contaminationFlag.upper()
    requires_testing = flag in UNSAFE_FLAGS or flag in {"UNKNOWN", "INDUSTRIAL_NEARBY"}
    return {
        **runoff,
        "contaminationFlag": flag,
        "proposedUse": payload.proposedUse,
        "autoApproved": False,
        "safeToReuse": False,
        "potableClaim": False,
        "requiresQualifiedReview": True,
        "requiresWaterQualityTesting": requires_testing,
        "reviewStatusSuggested": "NEEDS_FURTHER_ASSESSMENT" if flag in UNSAFE_FLAGS else "PENDING",
        "safetyNotes": (
            "Road runoff and indoor floodwater must not be approved from a volume estimate."
            if flag in UNSAFE_FLAGS
            else "Do not label this site safe or approved based only on a numerical estimate. Water is not claimed potable."
        ),
    }
