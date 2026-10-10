package com.jalloop.dto;

import com.jalloop.enums.ContaminationFlag;
import com.jalloop.enums.ImplementationStatus;
import com.jalloop.enums.ReviewStatus;
import com.jalloop.enums.SurfaceType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class RecoveryDtos {
    private RecoveryDtos() {}

    public record RainfallRequest(
            @NotNull @DecimalMin("0.0") BigDecimal rainfallMm,
            @Size(max = 240) String locationLabel,
            @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal longitude,
            @NotNull Instant observedAt,
            @NotBlank @Size(max = 80) String sourceNote
    ) {}

    public record CatchmentRequest(
            @NotBlank @Size(max = 160) String name,
            @NotNull @DecimalMin("0.01") BigDecimal areaSqM,
            @NotNull SurfaceType surfaceType,
            @DecimalMin("0.0") @DecimalMax("1.0") BigDecimal runoffCoefficient,
            @DecimalMin("0.0") BigDecimal storageCapacityM3,
            @DecimalMin("0.0") @DecimalMax("1.0") BigDecimal collectionEfficiency,
            @Size(max = 240) String proposedUse,
            @NotNull ContaminationFlag contaminationFlag,
            @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal latitude,
            @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal longitude
    ) {}

    public record AssessmentRequest(
            @NotNull UUID catchmentId,
            UUID rainfallObservationId,
            @DecimalMin("0.0") BigDecimal rainfallMm
    ) {}

    public record ProjectRequest(
            @NotNull UUID assessmentId,
            @NotBlank @Size(max = 160) String title
    ) {}

    public record ReviewRequest(
            @NotNull ReviewStatus reviewStatus,
            ImplementationStatus implementationStatus,
            @Size(max = 2000) String reviewReason,
            @Size(max = 2000) String constraints
    ) {}

    public record MeasurementRequest(
            @NotNull @DecimalMin("0.0") BigDecimal measuredVolumeM3,
            @NotBlank @Size(max = 240) String method,
            @NotNull Instant measuredAt
    ) {}

    public record AssessmentView(
            UUID id,
            UUID catchmentId,
            String catchmentName,
            BigDecimal rainfallMm,
            BigDecimal theoreticalRunoffM3,
            BigDecimal potentiallyCollectibleM3,
            BigDecimal storageConstrainedM3,
            String assumptions,
            String safetyNotes,
            ReviewStatus reviewStatus,
            boolean autoApproved,
            boolean syntheticDemo,
            Instant createdAt
    ) {}

    public record MeasurementView(
            UUID id,
            BigDecimal measuredVolumeM3,
            String method,
            Instant measuredAt,
            boolean syntheticDemo
    ) {}

    public record ProjectView(
            UUID id,
            UUID assessmentId,
            String title,
            ReviewStatus reviewStatus,
            ImplementationStatus implementationStatus,
            String reviewReason,
            String constraints,
            boolean syntheticDemo,
            List<MeasurementView> measurements
    ) {}
}
