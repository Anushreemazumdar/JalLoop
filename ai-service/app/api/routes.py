from fastapi import APIRouter

from app.agents.explain import explain, strands_available
from app.analysis import duplicates, hotspots, recovery, runoff, shortages, structure
from app.schemas.models import (
    DuplicateRequest,
    ExplainRequest,
    HotspotRequest,
    RecoveryAssessRequest,
    RunoffRequest,
    ShortagePrioritizeRequest,
    StructureRequest,
)

router = APIRouter()


@router.post("/internal/v1/reports/structure")
def structure_report(payload: StructureRequest):
    return structure.structure_report(payload)


@router.post("/internal/v1/reports/duplicate-candidates")
def duplicate_candidates(payload: DuplicateRequest):
    return duplicates.find_candidates(payload)


@router.post("/internal/v1/hotspots/analyze")
def hotspot_analyze(payload: HotspotRequest):
    return hotspots.analyze(payload)


@router.post("/internal/v1/runoff/estimate")
def runoff_estimate(payload: RunoffRequest):
    return runoff.estimate(payload)


@router.post("/internal/v1/recovery/assess")
def recovery_assess(payload: RecoveryAssessRequest):
    return recovery.assess(payload)


@router.post("/internal/v1/shortages/prioritize")
def shortage_prioritize(payload: ShortagePrioritizeRequest):
    return shortages.prioritize(payload)


@router.post("/internal/v1/agents/explain")
def agent_explain(payload: ExplainRequest):
    result = explain(payload)
    result["strandsConfigured"] = strands_available()
    return result
