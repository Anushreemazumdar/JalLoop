import json
import os
from typing import Any

from pydantic import BaseModel, Field


class ExplanationModel(BaseModel):
    recommendation: str
    supportingEvidence: list[str] = Field(default_factory=list)
    knownInputs: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    missingInformation: list[str] = Field(default_factory=list)
    confidenceNote: str
    method: str
    usedFallback: bool
    humanReviewRequired: bool = True


SYSTEM_PROMPT = """You are a civic water-resilience analyst for JalLoop.
Use ONLY the JSON evidence provided. Do not invent incidents, measurements, rainfall, water-quality results, dates, coordinates, repairs, or citations.
Distinguish observed records from recommendations. Always require human review.
If evidence is missing, list it under missingInformation instead of guessing.
"""


def deterministic_explain(payload) -> dict[str, Any]:
    incident = payload.incident or {}
    reports = payload.reports or []
    nearby = payload.nearbyHistory or []
    inspections = payload.inspections or []
    evidence = [
        f"Canonical status: {incident.get('status', 'unknown')}",
        f"Category: {incident.get('category', 'unknown')}",
        f"Citizen reports supplied: {len(reports)}",
        f"Nearby historical records supplied: {len(nearby)}",
    ]
    if incident.get("syntheticDemo"):
        evidence.append("This incident is labelled synthetic demonstration data.")
    missing = []
    if not inspections:
        missing.append("No inspection findings were supplied.")
    if not incident.get("severity"):
        missing.append("Severity was not assessed.")
    recommendation = incident.get("recommendedNextAction") or (
        "Review supplied reports and schedule inspection. Advisory only."
    )
    if nearby:
        recommendation = (
            "This location has prior supplied records. Treat recurrence as a maintenance signal, "
            "then confirm on site. Do not merge records automatically. Advisory only."
        )
    return ExplanationModel(
        recommendation=recommendation,
        supportingEvidence=evidence,
        knownInputs=["Fields provided in the request JSON only"],
        assumptions=[
            "No unprovided rainfall, lab results, or official statistics were used.",
            "Nearby records are candidate history, not proof of the same physical asset.",
        ],
        missingInformation=missing,
        confidenceNote="Deterministic heuristic. No model was called.",
        method="DETERMINISTIC_HEURISTIC",
        usedFallback=True,
        humanReviewRequired=True,
    ).model_dump()


def strands_available() -> bool:
    if os.getenv("JALLOOP_FORCE_DETERMINISTIC_AGENT", "0") == "1":
        return False
    return bool(os.getenv("OPENAI_API_KEY"))


def explain_with_strands(payload) -> dict[str, Any]:
    from strands import Agent
    from strands.models.openai import OpenAIModel

    evidence_json = json.dumps(
        {
            "incident": payload.incident,
            "reports": payload.reports,
            "nearbyHistory": payload.nearbyHistory,
            "statusHistory": payload.statusHistory,
            "inspections": payload.inspections,
        },
        default=str,
    )
    model = OpenAIModel(model_id=os.getenv("STRANDS_MODEL_ID", "gpt-4o-mini"))
    agent = Agent(
        model=model,
        system_prompt=SYSTEM_PROMPT,
        callback_handler=None,
    )
    prompt = (
        "Produce a structured explanation grounded only in this evidence JSON:\n"
        f"{evidence_json}\n"
        "Do not add facts that are not present."
    )
    result = agent(prompt, structured_output_model=ExplanationModel)
    data = result.structured_output.model_dump()
    data["method"] = "STRANDS_AGENTS_SDK"
    data["usedFallback"] = False
    data["humanReviewRequired"] = True
    data["modelId"] = os.getenv("STRANDS_MODEL_ID", "gpt-4o-mini")
    return data


def explain(payload) -> dict[str, Any]:
    if not strands_available():
        return deterministic_explain(payload)
    try:
        return explain_with_strands(payload)
    except Exception as exc:
        fallback = deterministic_explain(payload)
        fallback["confidenceNote"] = (
            "Strands Agents SDK was attempted and failed; deterministic fallback used. "
            f"Error type: {type(exc).__name__}."
        )
        fallback["strandsError"] = type(exc).__name__
        return fallback
