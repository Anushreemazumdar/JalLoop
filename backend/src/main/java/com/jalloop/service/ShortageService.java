package com.jalloop.service;

import com.jalloop.dto.ShortageDtos;
import com.jalloop.entity.Actor;
import com.jalloop.entity.WaterShortage;
import com.jalloop.enums.Severity;
import com.jalloop.repository.WaterShortageRepository;
import com.jalloop.util.GeoUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class ShortageService {
    private final WaterShortageRepository shortageRepository;
    private final AuditService auditService;
    private final AiClientService aiClientService;

    public ShortageService(WaterShortageRepository shortageRepository, AuditService auditService, AiClientService aiClientService) {
        this.shortageRepository = shortageRepository;
        this.auditService = auditService;
        this.aiClientService = aiClientService;
    }

    @Transactional
    public ShortageDtos.ShortageView create(ShortageDtos.CreateShortageRequest request, Actor reporter) {
        GeoUtil.validateCoordinates(request.latitude(), request.longitude());
        WaterShortage shortage = new WaterShortage();
        shortage.setReporter(reporter);
        shortage.setLatitude(request.latitude());
        shortage.setLongitude(request.longitude());
        shortage.setLocationLabel(request.locationLabel());
        shortage.setSeverity(request.severity());
        shortage.setDescription(request.description());
        shortage.setObservedAt(request.observedAt());
        shortage.setEstimatedAffectedDemandM3PerDay(request.estimatedAffectedDemandM3PerDay());
        shortage.setSyntheticDemo(false);
        applyHeuristic(shortage);
        shortage = shortageRepository.save(shortage);
        aiClientService.post("/internal/v1/shortages/prioritize", Map.of(
                "severity", request.severity().name(),
                "estimatedAffectedDemandM3PerDay", request.estimatedAffectedDemandM3PerDay(),
                "observedAt", request.observedAt().toString()
        ), "shortage-prioritize");
        auditService.record(reporter, "CREATE_SHORTAGE", "WaterShortage", shortage.getId().toString(), "Shortage reported");
        return toView(shortage);
    }

    @Transactional(readOnly = true)
    public List<ShortageDtos.ShortageView> list(Severity severity) {
        List<WaterShortage> rows = severity == null
                ? shortageRepository.findAllByOrderByCreatedAtDesc()
                : shortageRepository.findBySeverityOrderByCreatedAtDesc(severity);
        return rows.stream().map(this::toView).toList();
    }

    public void applyHeuristic(WaterShortage shortage) {
        double severityWeight = switch (shortage.getSeverity()) {
            case LOW -> 0.25;
            case MODERATE -> 0.5;
            case HIGH -> 0.75;
            case CRITICAL -> 1.0;
        };
        double demandWeight = 0.0;
        if (shortage.getEstimatedAffectedDemandM3PerDay() != null) {
            demandWeight = Math.min(1.0, shortage.getEstimatedAffectedDemandM3PerDay().doubleValue() / 50.0);
        }
        long hours = Math.max(0, Duration.between(shortage.getObservedAt(), Instant.now()).toHours());
        double urgency = Math.min(1.0, hours / 72.0);
        double score = 0.5 * severityWeight + 0.3 * demandWeight + 0.2 * urgency;
        shortage.setHeuristicPriorityScore(BigDecimal.valueOf(score).setScale(3, RoundingMode.HALF_UP));
        shortage.setHeuristicPriorityBand(score >= 0.75 ? "HIGH" : score >= 0.45 ? "MEDIUM" : "LOW");
    }

    public ShortageDtos.ShortageView toView(WaterShortage s) {
        return new ShortageDtos.ShortageView(
                s.getId(), s.getLatitude(), s.getLongitude(), s.getLocationLabel(), s.getSeverity(),
                s.getDescription(), s.getObservedAt(), s.getEstimatedAffectedDemandM3PerDay(),
                s.getHeuristicPriorityScore(), s.getHeuristicPriorityBand(), s.isSyntheticDemo(), s.getCreatedAt()
        );
    }
}
