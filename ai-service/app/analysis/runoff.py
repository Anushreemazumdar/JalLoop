from aws_lambda_powertools import Logger

logger = Logger(service="jalloop-ai")
def theoretical_runoff_m3(rainfall_mm: float, area_sq_m: float, coefficient: float) -> float:
    return round(rainfall_mm * area_sq_m * coefficient / 1000.0, 4)


def potentially_collectible_m3(runoff_m3: float, efficiency: float) -> float:
    return round(runoff_m3 * efficiency, 4)



def storage_constrained_m3(collectible_m3: float, storage_capacity_m3: float | None) -> float:
    if storage_capacity_m3 is None:
        return collectible_m3
    return round(min(collectible_m3, storage_capacity_m3), 4)



def estimate(payload) -> dict:
    runoff = theoretical_runoff_m3(
        payload.rainfallMm,
        payload.areaSqM,
        payload.runoffCoefficient,
    )
    collectible = potentially_collectible_m3(
        runoff,
        payload.collectionEfficiency,
    )
    constrained = storage_constrained_m3(
        collectible,
        payload.storageCapacityM3,
    )

    logger.info({
        "event": "runoff_estimate_completed",
        "kind": "CALCULATED_ESTIMATE",
        "theoreticalRunoffM3": runoff,
        "potentiallyCollectibleM3": collectible,
        "storageConstrainedM3": constrained,
        "storageCapacityApplied": payload.storageCapacityM3 is not None,
    })

    return {
        "formula": "V = P × A × C / 1000",
        "inputs": {
            "P_mm": payload.rainfallMm,
            "A_m2": payload.areaSqM,
            "C": payload.runoffCoefficient,
            "collectionEfficiency": payload.collectionEfficiency,
            "storageCapacityM3": payload.storageCapacityM3,
        },
        "theoreticalRunoffM3": runoff,
        "potentiallyCollectibleM3": collectible,
        "storageConstrainedM3": constrained,
        "kind": "CALCULATED_ESTIMATE",
        "notActualCapture": True,
        "notes": [
            "Theoretical runoff is not recovered water.",
            "Collection efficiency is applied once after runoff.",
            "Storage constraint is applied after efficiency.",
        ],
    }
