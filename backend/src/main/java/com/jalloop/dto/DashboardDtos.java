package com.jalloop.dto;

import com.jalloop.enums.IncidentCategory;
import com.jalloop.enums.IncidentStatus;
import com.jalloop.enums.Severity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class DashboardDtos {
    private DashboardDtos() {}

    public record Summary(
            long totalIncidents,
            long unresolvedIncidents,
            long recurringHotspots,
            long waterShortageReports,
            long recoveryAssessmentsAwaitingReview,
            BigDecimal estimatedPotentiallyRecoverableM3,
            BigDecimal verifiedRecoveredM3,
            boolean usingSyntheticDemonstrationData,
            String dataIntegrityNote,
            List<IncidentDtos.IncidentSummary> recentIncidents,
            List<PriorityItem> priorityItems
    ) {}

    public record PriorityItem(
            String kind,
            UUID entityId,
            String title,
            String reason,
            Severity severity
    ) {}

    public record Hotspot(
            String id,
            BigDecimal latitude,
            BigDecimal longitude,
            IncidentCategory dominantCategory,
            long incidentCount,
            long unresolvedCount,
            BigDecimal heuristicScore,
            String heuristicLabel,
            boolean syntheticDemo
    ) {}

    public record RecoveryOverview(
            BigDecimal estimatedPotentiallyRecoverableM3,
            BigDecimal verifiedRecoveredM3,
            String note,
            List<RecoveryDtos.AssessmentView> assessments,
            List<RecoveryDtos.ProjectView> projects
    ) {}

    public record ExplainRequest(UUID incidentId) {}

    public record ExplainResponse(
            UUID incidentId,
            String recommendation,
            List<String> supportingEvidence,
            List<String> knownInputs,
            List<String> assumptions,
            List<String> missingInformation,
            String confidenceNote,
            String method,
            boolean humanReviewRequired,
            boolean usedFallback,
            Instant generatedAt
    ) {}
}
