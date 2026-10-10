package com.jalloop.dto;

import com.jalloop.enums.IncidentCategory;
import com.jalloop.enums.IncidentStatus;
import com.jalloop.enums.LocationType;
import com.jalloop.enums.Severity;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class IncidentDtos {
    private IncidentDtos() {}

    public record CreateIncidentRequest(
            @NotNull IncidentCategory category,
            @NotBlank @Size(max = 2000) String description,
            @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal latitude,
            @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal longitude,
            @NotNull LocationType locationType,
            Severity severity,
            @NotNull Instant observedAt,
            @Size(max = 240) String locationLabel
    ) {}

    public record StatusPatchRequest(
            @NotNull IncidentStatus status,
            @Size(max = 400) String reason
    ) {}

    public record AssignmentRequest(
            @NotBlank String assigneeActorKey,
            @NotBlank @Size(max = 400) String note
    ) {}

    public record InspectionRequest(
            @NotBlank @Size(max = 2000) String findings,
            @Size(max = 400) String suspectedCause,
            @NotNull Instant inspectedAt
    ) {}

    public record VerificationRequest(
            boolean outcomeConfirmed,
            @NotBlank @Size(max = 2000) String notes,
            @NotNull Instant verifiedAt
    ) {}

    public record ReportView(
            UUID id,
            Instant observedAt,
            Instant createdAt,
            String description,
            Severity severity,
            boolean syntheticDemo,
            String reporterDisplayName
    ) {}

    public record NearbyIncidentView(
            UUID id,
            IncidentCategory category,
            IncidentStatus status,
            Instant lastObservedAt,
            double distanceMeters,
            boolean syntheticDemo
    ) {}

    public record DuplicateHint(boolean suspectedDuplicate, List<NearbyIncidentView> candidates) {}

    public record IncidentSummary(
            UUID id,
            IncidentCategory category,
            IncidentStatus status,
            Severity severity,
            LocationType locationType,
            BigDecimal latitude,
            BigDecimal longitude,
            String locationLabel,
            String summary,
            Instant firstObservedAt,
            Instant lastObservedAt,
            boolean syntheticDemo,
            boolean suspectedDuplicate,
            String recommendedNextAction
    ) {}

    public record AssignmentView(UUID id, String assignee, String assignedBy, String note, Instant createdAt) {}
    public record InspectionView(UUID id, String inspector, String findings, String suspectedCause, Instant inspectedAt) {}
    public record VerificationView(UUID id, String verifier, boolean outcomeConfirmed, String notes, Instant verifiedAt) {}
    public record StatusHistoryView(IncidentStatus fromStatus, IncidentStatus toStatus, String changedBy, String reason, Instant changedAt) {}

    public record IncidentDetail(
            IncidentSummary incident,
            List<ReportView> reports,
            List<AssignmentView> assignments,
            List<InspectionView> inspections,
            List<VerificationView> verifications,
            List<StatusHistoryView> statusHistory,
            List<NearbyIncidentView> nearbyHistory,
            DuplicateHint duplicateHint
    ) {}

    public record IncidentPage(List<IncidentSummary> items, CommonDtos.PageMeta meta) {}

    public record CreateIncidentResponse(UUID incidentId, UUID reportId, IncidentStatus status, DuplicateHint duplicateHint) {}
}
