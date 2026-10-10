from typing import Any

from pydantic import BaseModel, Field


class StructureRequest(BaseModel):
    description: str
    category: str | None = None


class DuplicateRequest(BaseModel):
    latitude: float
    longitude: float
    category: str
    description: str
    candidates: list[dict[str, Any]] = Field(default_factory=list)


class HotspotRequest(BaseModel):
    incidents: list[dict[str, Any]] = Field(default_factory=list)
    hotspotCount: int | None = None


class RunoffRequest(BaseModel):
    rainfallMm: float = Field(ge=0)
    areaSqM: float = Field(gt=0)
    runoffCoefficient: float = Field(ge=0, le=1)
    collectionEfficiency: float = Field(default=0.8, ge=0, le=1)
    storageCapacityM3: float | None = Field(default=None, ge=0)


class RecoveryAssessRequest(RunoffRequest):
    contaminationFlag: str = "UNKNOWN"
    proposedUse: str | None = None


class ShortagePrioritizeRequest(BaseModel):
    severity: str
    estimatedAffectedDemandM3PerDay: float | None = None
    observedAt: str | None = None


class ExplainRequest(BaseModel):
    incident: dict[str, Any] | None = None
    reports: list[dict[str, Any]] = Field(default_factory=list)
    nearbyHistory: list[dict[str, Any]] = Field(default_factory=list)
    statusHistory: list[dict[str, Any]] = Field(default_factory=list)
    inspections: list[dict[str, Any]] = Field(default_factory=list)
