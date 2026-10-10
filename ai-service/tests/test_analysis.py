import os

from fastapi.testclient import TestClient

os.environ["JALLOOP_FORCE_DETERMINISTIC_AGENT"] = "1"

from app.main import app  # noqa: E402
from app.analysis.runoff import theoretical_runoff_m3
from app.schemas.models import DuplicateRequest, ExplainRequest, RunoffRequest, ShortagePrioritizeRequest
from app.analysis.duplicates import find_candidates
from app.analysis.shortages import prioritize
from app.agents.explain import explain

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "UP"


def test_runoff_example():
    assert theoretical_runoff_m3(20, 1000, 0.8) == 16.0
    payload = RunoffRequest(
        rainfallMm=20,
        areaSqM=1000,
        runoffCoefficient=0.8,
        collectionEfficiency=0.8,
        storageCapacityM3=10,
    )
    response = client.post("/internal/v1/runoff/estimate", json=payload.model_dump())
    body = response.json()
    assert body["theoreticalRunoffM3"] == 16.0
    assert body["potentiallyCollectibleM3"] == 12.8
    assert body["storageConstrainedM3"] == 10.0
    assert body["notActualCapture"] is True


def test_duplicates_never_auto_merge():
    payload = DuplicateRequest(
        latitude=18.52,
        longitude=73.85,
        category="WATERLOGGING",
        description="water on the road after rain",
        candidates=[
            {
                "id": "a",
                "latitude": 18.5201,
                "longitude": 73.8501,
                "category": "WATERLOGGING",
                "description": "water on the road after rain",
            }
        ],
    )
    result = find_candidates(payload)
    assert result["autoMerged"] is False
    assert result["candidates"][0]["requiresHumanReview"] is True


def test_hotspot_and_shortage():
    hot = client.post("/internal/v1/hotspots/analyze", json={
        "incidents": [
            {"status": "REPORTED"},
            {"status": "VERIFIED"},
        ]
    }).json()
    assert "heuristicScore" in hot
    result = prioritize(ShortagePrioritizeRequest(severity="HIGH"))
    assert "estimatedAffectedDemandM3PerDay not supplied" in result["missingInformation"]
    assert result["availableWaterInvented"] is False


def test_recovery_does_not_auto_approve_road_runoff():
    body = client.post("/internal/v1/recovery/assess", json={
        "rainfallMm": 20,
        "areaSqM": 1000,
        "runoffCoefficient": 0.8,
        "collectionEfficiency": 0.8,
        "storageCapacityM3": 10,
        "contaminationFlag": "ROAD_RUNOFF",
    }).json()
    assert body["autoApproved"] is False
    assert body["safeToReuse"] is False
    assert body["reviewStatusSuggested"] == "NEEDS_FURTHER_ASSESSMENT"


def test_explain_fallback_without_keys():
    result = explain(ExplainRequest(incident={"status": "REPORTED", "category": "PIPE_LEAK", "syntheticDemo": True}))
    assert result["method"] == "DETERMINISTIC_HEURISTIC"
    assert result["usedFallback"] is True
    assert result["humanReviewRequired"] is True
    response = client.post("/internal/v1/agents/explain", json={"incident": {"status": "REPORTED"}})
    assert response.status_code == 200
    assert response.json()["humanReviewRequired"] is True
