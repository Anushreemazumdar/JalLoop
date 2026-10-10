package com.jalloop.service;

import com.jalloop.dto.DashboardDtos;
import com.jalloop.dto.IncidentDtos;
import com.jalloop.entity.Incident;
import com.jalloop.entity.RecoveryAssessment;
import com.jalloop.entity.WaterShortage;
import com.jalloop.enums.IncidentStatus;
import com.jalloop.enums.ReviewStatus;
import com.jalloop.enums.Severity;
import com.jalloop.repository.IncidentRepository;
import com.jalloop.repository.RecoveryAssessmentRepository;
import com.jalloop.repository.RecoveryMeasurementRepository;
import com.jalloop.repository.WaterShortageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {
    private final IncidentRepository incidentRepository;
    private final WaterShortageRepository shortageRepository;
    private final RecoveryAssessmentRepository assessmentRepository;
    private final RecoveryMeasurementRepository measurementRepository;
    private final IncidentService incidentService;
    private final RecoveryService recoveryService;
    private final AiClientService aiClientService;

    public DashboardService(
            IncidentRepository incidentRepository,
            WaterShortageRepository shortageRepository,
            RecoveryAssessmentRepository assessmentRepository,
            RecoveryMeasurementRepository measurementRepository,
            IncidentService incidentService,
            RecoveryService recoveryService,
            AiClientService aiClientService
    ) {
        this.incidentRepository = incidentRepository;
        this.shortageRepository = shortageRepository;
        this.assessmentRepository = assessmentRepository;
        this.measurementRepository = measurementRepository;
        this.incidentService = incidentService;
        this.recoveryService = recoveryService;
        this.aiClientService = aiClientService;
    }

    @Transactional(readOnly = true)
    public DashboardDtos.Summary summary() {
        List<IncidentStatus> closed = List.of(IncidentStatus.RESOLVED, IncidentStatus.VERIFIED, IncidentStatus.REJECTED_DUPLICATE);
        List<DashboardDtos.Hotspot> hotspots = hotspots();
        BigDecimal estimated = assessmentRepository.findAll().stream()
                .map(RecoveryAssessment::getStorageConstrainedM3)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal verified = measurementRepository.sumMeasuredVolume();
        if (verified == null) {
            verified = BigDecimal.ZERO;
        }
        boolean synthetic = incidentRepository.countBySyntheticDemoTrue() > 0;

        List<DashboardDtos.PriorityItem> priority = new ArrayList<>();
        incidentRepository.findAll().stream()
                .filter(i -> i.getStatus() != IncidentStatus.RESOLVED && i.getStatus() != IncidentStatus.VERIFIED)
                .filter(i -> i.getSeverity() == Severity.HIGH || i.getSeverity() == Severity.CRITICAL || i.isSuspectedDuplicate())
                .limit(6)
                .forEach(i -> priority.add(new DashboardDtos.PriorityItem(
                        "INCIDENT", i.getId(), i.getSummary(),
                        i.isSuspectedDuplicate() ? "Suspected duplicate awaiting review" : "Open " + i.getSeverity() + " incident",
                        i.getSeverity())));
        shortageRepository.findAllByOrderByCreatedAtDesc().stream().limit(3).forEach(s ->
                priority.add(new DashboardDtos.PriorityItem(
                        "SHORTAGE", s.getId(), s.getDescription(),
                        "Heuristic band " + s.getHeuristicPriorityBand() + " — no supply promise",
                        s.getSeverity())));

        return new DashboardDtos.Summary(
                incidentRepository.count(),
                incidentRepository.countByStatusNotIn(closed),
                hotspots.size(),
                shortageRepository.count(),
                assessmentRepository.countByReviewStatus(ReviewStatus.PENDING),
                estimated,
                verified,
                synthetic,
                "Estimated recoverable volume is never added to verified recovered volume. Seeded rows are labelled synthetic.",
                incidentRepository.findTop8ByOrderByUpdatedAtDesc().stream().map(incidentService::toSummary).toList(),
                priority
        );
    }

    @Transactional(readOnly = true)
    public List<DashboardDtos.Hotspot> hotspots() {
        Map<String, List<Incident>> buckets = new HashMap<>();
        for (Incident incident : incidentRepository.findAll()) {
            String key = round(incident.getLatitude()) + "," + round(incident.getLongitude());
            buckets.computeIfAbsent(key, k -> new ArrayList<>()).add(incident);
        }
        List<DashboardDtos.Hotspot> result = new ArrayList<>();
        int idx = 0;
        for (Map.Entry<String, List<Incident>> entry : buckets.entrySet()) {
            List<Incident> group = entry.getValue();
            if (group.size() < 2) {
                continue;
            }
            long unresolved = group.stream().filter(i ->
                    i.getStatus() != IncidentStatus.RESOLVED
                            && i.getStatus() != IncidentStatus.VERIFIED
                            && i.getStatus() != IncidentStatus.REJECTED_DUPLICATE).count();
            double score = 0.4 * Math.min(1.0, group.size() / 5.0)
                    + 0.4 * (unresolved / (double) group.size())
                    + 0.2 * group.stream().mapToDouble(i -> severityWeight(i.getSeverity())).average().orElse(0);
            result.add(new DashboardDtos.Hotspot(
                    "hotspot-" + idx++,
                    group.getFirst().getLatitude(),
                    group.getFirst().getLongitude(),
                    group.getFirst().getCategory(),
                    group.size(),
                    unresolved,
                    BigDecimal.valueOf(score).setScale(3, RoundingMode.HALF_UP),
                    "Heuristic recurrence score, not a scientific prediction",
                    group.stream().anyMatch(Incident::isSyntheticDemo)
            ));
        }
        aiClientService.post("/internal/v1/hotspots/analyze", Map.of(
                "hotspotCount", result.size()
        ), "hotspot-analyze");
        return result;
    }

    @Transactional(readOnly = true)
    public DashboardDtos.RecoveryOverview recovery() {
        BigDecimal estimated = assessmentRepository.findAll().stream()
                .map(RecoveryAssessment::getStorageConstrainedM3)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal verified = measurementRepository.sumMeasuredVolume();
        if (verified == null) {
            verified = BigDecimal.ZERO;
        }
        return new DashboardDtos.RecoveryOverview(
                estimated,
                verified,
                "These two totals are independent. Do not add them together.",
                recoveryService.listAssessments(),
                recoveryService.listProjects()
        );
    }

    @Transactional(readOnly = true)
    public DashboardDtos.ExplainResponse explain(java.util.UUID incidentId) {
        IncidentDtos.IncidentDetail detail = incidentService.get(incidentId);
        Map<String, Object> payload = Map.of(
                "incident", detail.incident(),
                "reports", detail.reports(),
                "nearbyHistory", detail.nearbyHistory(),
                "statusHistory", detail.statusHistory(),
                "inspections", detail.inspections()
        );
        return aiClientService.post("/internal/v1/agents/explain", payload, "explain")
                .map(map -> new DashboardDtos.ExplainResponse(
                        incidentId,
                        String.valueOf(map.getOrDefault("recommendation", "")),
                        castStrings(map.get("supportingEvidence")),
                        castStrings(map.get("knownInputs")),
                        castStrings(map.get("assumptions")),
                        castStrings(map.get("missingInformation")),
                        String.valueOf(map.getOrDefault("confidenceNote", "")),
                        String.valueOf(map.getOrDefault("method", "UNAVAILABLE")),
                        true,
                        Boolean.TRUE.equals(map.get("usedFallback")) || "DETERMINISTIC_HEURISTIC".equals(map.get("method")),
                        java.time.Instant.now()
                ))
                .orElseGet(() -> localExplain(detail));
    }

    private DashboardDtos.ExplainResponse localExplain(IncidentDtos.IncidentDetail detail) {
        List<String> evidence = new ArrayList<>();
        evidence.add("Canonical incident status: " + detail.incident().status());
        evidence.add("Citizen reports attached: " + detail.reports().size());
        evidence.add("Nearby historical records within search radius: " + detail.nearbyHistory().size());
        List<String> missing = new ArrayList<>();
        if (detail.inspections().isEmpty()) {
            missing.add("No inspection findings are on record.");
        }
        if (detail.incident().severity() == null) {
            missing.add("Severity was not assessed by the reporter.");
        }
        String recommendation = detail.incident().recommendedNextAction() != null
                ? detail.incident().recommendedNextAction()
                : "Review the attached reports and schedule an inspection. This is advisory only.";
        return new DashboardDtos.ExplainResponse(
                detail.incident().id(),
                recommendation,
                evidence,
                List.of("incident fields supplied by the backend", "nearby incidents computed locally"),
                List.of("No unprovided rainfall, water-quality, or official statistics were invented."),
                missing,
                "Deterministic fallback; no model credentials were used.",
                "DETERMINISTIC_HEURISTIC",
                true,
                true,
                java.time.Instant.now()
        );
    }

    @SuppressWarnings("unchecked")
    private List<String> castStrings(Object value) {
        if (value instanceof List<?> list) {
            return list.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    private double severityWeight(Severity severity) {
        if (severity == null) {
            return 0.4;
        }
        return switch (severity) {
            case LOW -> 0.25;
            case MODERATE -> 0.5;
            case HIGH -> 0.75;
            case CRITICAL -> 1.0;
        };
    }

    private String round(BigDecimal value) {
        return value.setScale(3, RoundingMode.HALF_UP).toPlainString();
    }
}
