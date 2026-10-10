package com.jalloop.dto;

import com.jalloop.enums.Severity;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class ShortageDtos {
    private ShortageDtos() {}

    public record CreateShortageRequest(
            @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal latitude,
            @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal longitude,
            @Size(max = 240) String locationLabel,
            @NotNull Severity severity,
            @NotBlank @Size(max = 2000) String description,
            @NotNull Instant observedAt,
            @DecimalMin("0.0") BigDecimal estimatedAffectedDemandM3PerDay
    ) {}

    public record ShortageView(
            UUID id,
            BigDecimal latitude,
            BigDecimal longitude,
            String locationLabel,
            Severity severity,
            String description,
            Instant observedAt,
            BigDecimal estimatedAffectedDemandM3PerDay,
            BigDecimal heuristicPriorityScore,
            String heuristicPriorityBand,
            boolean syntheticDemo,
            Instant createdAt
    ) {}
}
