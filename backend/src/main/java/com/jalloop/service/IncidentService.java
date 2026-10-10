package com.jalloop.service;

import com.jalloop.dto.CommonDtos;
import com.jalloop.dto.IncidentDtos;
import com.jalloop.entity.*;
import com.jalloop.enums.IncidentCategory;
import com.jalloop.enums.IncidentStatus;
import com.jalloop.enums.Severity;
import com.jalloop.exception.ApiException;
import com.jalloop.repository.*;
import com.jalloop.util.GeoUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class IncidentService {
    private final IncidentRepository incidentRepository;
    private final CitizenReportRepository reportRepository;
    private final AssignmentRepository assignmentRepository;
    private final InspectionRepository inspectionRepository;
    private final VerificationRepository verificationRepository;
    private final IncidentStatusHistoryRepository statusHistoryRepository;
    private final ActorRepository actorRepository;
    private final AuditService auditService;
    private final AiClientService aiClientService;

    public IncidentService(
            IncidentRepository incidentRepository,
            CitizenReportRepository reportRepository,
            AssignmentRepository assignmentRepository,
            InspectionRepository inspectionRepository,
            VerificationRepository verificationRepository,
            IncidentStatusHistoryRepository statusHistoryRepository,
            ActorRepository actorRepository,
            AuditService auditService,
            AiClientService aiClientService
    ) {
        this.incidentRepository = incidentRepository;
        this.reportRepository = reportRepository;
        this.assignmentRepository = assignmentRepository;
        this.inspectionRepository = inspectionRepository;
        this.verificationRepository = verificationRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.actorRepository = actorRepository;
        this.auditService = auditService;
        this.aiClientService = aiClientService;
    }

    @Transactional
    public IncidentDtos.CreateIncidentResponse create(IncidentDtos.CreateIncidentRequest request, Actor reporter) {
        try {
            GeoUtil.validateCoordinates(request.latitude(), request.longitude());
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest(ex.getMessage());
        }

        List<IncidentDtos.NearbyIncidentView> nearby = findNearby(
                request.latitude(), request.longitude(), request.category(), 150, Duration.ofHours(72));
        IncidentDtos.DuplicateHint hint = new IncidentDtos.DuplicateHint(!nearby.isEmpty(), nearby);

        Incident incident = new Incident();
        incident.setCategory(request.category());
        incident.setStatus(IncidentStatus.REPORTED);
        incident.setSeverity(request.severity());
        incident.setLocationType(request.locationType());
        incident.setLatitude(request.latitude());
        incident.setLongitude(request.longitude());
        incident.setLocationLabel(request.locationLabel());
        incident.setSummary(request.description());
        incident.setFirstObservedAt(request.observedAt());
        incident.setLastObservedAt(request.observedAt());
        incident.setSyntheticDemo(false);
        incident.setSuspectedDuplicate(!nearby.isEmpty());
        if (!nearby.isEmpty()) {
            incident.setDuplicateOf(incidentRepository.findById(nearby.getFirst().id()).orElse(null));
            incident.setRecommendedNextAction("Possible duplicate — keep as a separate report until an administrator reviews it.");
        } else {
            incident.setRecommendedNextAction("Record an inspection if flooding, leaks, or blocked drains persist at this location.");
        }
        incident = incidentRepository.save(incident);
        recordStatus(incident, null, IncidentStatus.REPORTED, reporter, "Citizen report created");

        CitizenReport report = new CitizenReport();
        report.setIncident(incident);
        report.setReporter(reporter);
        report.setCategory(request.category());
        report.setSeverity(request.severity());
        report.setLocationType(request.locationType());
        report.setLatitude(request.latitude());
        report.setLongitude(request.longitude());
        report.setDescription(request.description());
        report.setObservedAt(request.observedAt());
        report.setSyntheticDemo(false);
        report.setPhotoNote("Photo upload is not implemented in this local build.");
        report = reportRepository.save(report);

        aiClientService.post("/internal/v1/reports/structure", Map.of(
                "description", request.description(),
                "category", request.category().name()
        ), "structure-report");

        auditService.record(reporter, "CREATE_INCIDENT", "Incident", incident.getId().toString(), "Citizen report submitted");
        return new IncidentDtos.CreateIncidentResponse(incident.getId(), report.getId(), incident.getStatus(), hint);
    }

    @Transactional(readOnly = true)
    public IncidentDtos.IncidentPage list(IncidentCategory category, IncidentStatus status, Severity severity, int page, int size) {
        Page<Incident> result = incidentRepository.search(category, status, severity, PageRequest.of(page, size));
        return new IncidentDtos.IncidentPage(
                result.getContent().stream().map(this::toSummary).toList(),
                new CommonDtos.PageMeta(result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages())
        );
    }

    @Transactional(readOnly = true)
    public IncidentDtos.IncidentDetail get(UUID id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Incident not found"));
        List<IncidentDtos.NearbyIncidentView> nearby = findNearby(
                incident.getLatitude(), incident.getLongitude(), incident.getCategory(), 250, Duration.ofDays(365 * 5));
        nearby = nearby.stream().filter(n -> !n.id().equals(incident.getId())).toList();
        return new IncidentDtos.IncidentDetail(
                toSummary(incident),
                reportRepository.findByIncidentOrderByObservedAtAsc(incident).stream().map(this::toReport).toList(),
                assignmentRepository.findByIncidentOrderByCreatedAtDesc(incident).stream().map(this::toAssignment).toList(),
                inspectionRepository.findByIncidentOrderByInspectedAtDesc(incident).stream().map(this::toInspection).toList(),
                verificationRepository.findByIncidentOrderByVerifiedAtDesc(incident).stream().map(this::toVerification).toList(),
                statusHistoryRepository.findByIncidentOrderByChangedAtAsc(incident).stream().map(this::toHistory).toList(),
                nearby,
                new IncidentDtos.DuplicateHint(incident.isSuspectedDuplicate(), nearby)
        );
    }

    @Transactional
    public IncidentDtos.IncidentSummary updateStatus(UUID id, IncidentDtos.StatusPatchRequest request, Actor actor) {
        Incident incident = require(id);
        IncidentStatus from = incident.getStatus();
        incident.setStatus(request.status());
        incidentRepository.save(incident);
        recordStatus(incident, from, request.status(), actor, request.reason());
        auditService.record(actor, "PATCH_STATUS", "Incident", id.toString(), from + " -> " + request.status());
        return toSummary(incident);
    }

    @Transactional
    public IncidentDtos.AssignmentView assign(UUID id, IncidentDtos.AssignmentRequest request, Actor actor) {
        Incident incident = require(id);
        Actor assignee = actorRepository.findByActorKey(request.assigneeActorKey())
                .orElseThrow(() -> ApiException.badRequest("Unknown assignee actor key"));
        Assignment assignment = new Assignment();
        assignment.setIncident(incident);
        assignment.setAssignee(assignee);
        assignment.setAssignedBy(actor);
        assignment.setNote(request.note());
        assignmentRepository.save(assignment);
        IncidentStatus from = incident.getStatus();
        incident.setStatus(IncidentStatus.ASSIGNED);
        incidentRepository.save(incident);
        recordStatus(incident, from, IncidentStatus.ASSIGNED, actor, "Assigned to " + assignee.getDisplayName());
        auditService.record(actor, "ASSIGN", "Incident", id.toString(), assignee.getActorKey());
        return toAssignment(assignment);
    }

    @Transactional
    public IncidentDtos.InspectionView inspect(UUID id, IncidentDtos.InspectionRequest request, Actor actor) {
        Incident incident = require(id);
        Inspection inspection = new Inspection();
        inspection.setIncident(incident);
        inspection.setInspector(actor);
        inspection.setFindings(request.findings());
        inspection.setSuspectedCause(request.suspectedCause());
        inspection.setInspectedAt(request.inspectedAt());
        inspectionRepository.save(inspection);
        IncidentStatus from = incident.getStatus();
        incident.setStatus(IncidentStatus.INSPECTED);
        incidentRepository.save(incident);
        recordStatus(incident, from, IncidentStatus.INSPECTED, actor, "Inspection recorded");
        auditService.record(actor, "INSPECT", "Incident", id.toString(), "Inspection recorded");
        return toInspection(inspection);
    }

    @Transactional
    public IncidentDtos.VerificationView verify(UUID id, IncidentDtos.VerificationRequest request, Actor actor) {
        Incident incident = require(id);
        Verification verification = new Verification();
        verification.setIncident(incident);
        verification.setVerifier(actor);
        verification.setOutcomeConfirmed(request.outcomeConfirmed());
        verification.setNotes(request.notes());
        verification.setVerifiedAt(request.verifiedAt());
        verificationRepository.save(verification);
        IncidentStatus from = incident.getStatus();
        IncidentStatus next = request.outcomeConfirmed() ? IncidentStatus.VERIFIED : IncidentStatus.IN_PROGRESS;
        incident.setStatus(next);
        incidentRepository.save(incident);
        recordStatus(incident, from, next, actor, request.notes());
        auditService.record(actor, "VERIFY", "Incident", id.toString(), String.valueOf(request.outcomeConfirmed()));
        return toVerification(verification);
    }

    public List<IncidentDtos.NearbyIncidentView> findNearby(
            BigDecimal lat, BigDecimal lon, IncidentCategory category, double meters, Duration window) {
        Instant cutoff = Instant.now().minus(window);
        List<IncidentDtos.NearbyIncidentView> matches = new ArrayList<>();
        for (Incident other : incidentRepository.findAll()) {
            if (category != null && other.getCategory() != category) {
                continue;
            }
            if (other.getLastObservedAt().isBefore(cutoff)) {
                continue;
            }
            double distance = GeoUtil.haversineMeters(
                    lat.doubleValue(), lon.doubleValue(),
                    other.getLatitude().doubleValue(), other.getLongitude().doubleValue());
            if (distance <= meters) {
                matches.add(new IncidentDtos.NearbyIncidentView(
                        other.getId(), other.getCategory(), other.getStatus(), other.getLastObservedAt(),
                        Math.round(distance * 10.0) / 10.0, other.isSyntheticDemo()));
            }
        }
        matches.sort((a, b) -> Double.compare(a.distanceMeters(), b.distanceMeters()));
        return matches;
    }

    private Incident require(UUID id) {
        return incidentRepository.findById(id).orElseThrow(() -> ApiException.notFound("Incident not found"));
    }

    private void recordStatus(Incident incident, IncidentStatus from, IncidentStatus to, Actor actor, String reason) {
        IncidentStatusHistory history = new IncidentStatusHistory();
        history.setIncident(incident);
        history.setFromStatus(from);
        history.setToStatus(to);
        history.setChangedBy(actor);
        history.setReason(reason);
        statusHistoryRepository.save(history);
    }

    public IncidentDtos.IncidentSummary toSummary(Incident incident) {
        return new IncidentDtos.IncidentSummary(
                incident.getId(), incident.getCategory(), incident.getStatus(), incident.getSeverity(),
                incident.getLocationType(), incident.getLatitude(), incident.getLongitude(),
                incident.getLocationLabel(), incident.getSummary(), incident.getFirstObservedAt(),
                incident.getLastObservedAt(), incident.isSyntheticDemo(), incident.isSuspectedDuplicate(),
                incident.getRecommendedNextAction()
        );
    }

    private IncidentDtos.ReportView toReport(CitizenReport report) {
        String name = report.getReporter() != null ? report.getReporter().getDisplayName() : "Anonymous demo reporter";
        return new IncidentDtos.ReportView(report.getId(), report.getObservedAt(), report.getCreatedAt(),
                report.getDescription(), report.getSeverity(), report.isSyntheticDemo(), name);
    }

    private IncidentDtos.AssignmentView toAssignment(Assignment assignment) {
        return new IncidentDtos.AssignmentView(assignment.getId(), assignment.getAssignee().getDisplayName(),
                assignment.getAssignedBy().getDisplayName(), assignment.getNote(), assignment.getCreatedAt());
    }

    private IncidentDtos.InspectionView toInspection(Inspection inspection) {
        return new IncidentDtos.InspectionView(inspection.getId(), inspection.getInspector().getDisplayName(),
                inspection.getFindings(), inspection.getSuspectedCause(), inspection.getInspectedAt());
    }

    private IncidentDtos.VerificationView toVerification(Verification verification) {
        return new IncidentDtos.VerificationView(verification.getId(), verification.getVerifier().getDisplayName(),
                verification.isOutcomeConfirmed(), verification.getNotes(), verification.getVerifiedAt());
    }

    private IncidentDtos.StatusHistoryView toHistory(IncidentStatusHistory history) {
        String name = history.getChangedBy() != null ? history.getChangedBy().getDisplayName() : "system";
        return new IncidentDtos.StatusHistoryView(history.getFromStatus(), history.getToStatus(), name,
                history.getReason(), history.getChangedAt());
    }
}
