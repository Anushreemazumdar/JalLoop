package com.jalloop.service;

import com.jalloop.dto.RecoveryDtos;
import com.jalloop.entity.*;
import com.jalloop.enums.ContaminationFlag;
import com.jalloop.enums.ReviewStatus;
import com.jalloop.enums.SurfaceType;
import com.jalloop.exception.ApiException;
import com.jalloop.repository.*;
import com.jalloop.util.GeoUtil;
import com.jalloop.util.RunoffCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class RecoveryService {
    private final RainfallObservationRepository rainfallRepository;
    private final CatchmentRepository catchmentRepository;
    private final RecoveryAssessmentRepository assessmentRepository;
    private final RecoveryProjectRepository projectRepository;
    private final RecoveryMeasurementRepository measurementRepository;
    private final AuditService auditService;
    private final AiClientService aiClientService;

    public RecoveryService(
            RainfallObservationRepository rainfallRepository,
            CatchmentRepository catchmentRepository,
            RecoveryAssessmentRepository assessmentRepository,
            RecoveryProjectRepository projectRepository,
            RecoveryMeasurementRepository measurementRepository,
            AuditService auditService,
            AiClientService aiClientService
    ) {
        this.rainfallRepository = rainfallRepository;
        this.catchmentRepository = catchmentRepository;
        this.assessmentRepository = assessmentRepository;
        this.projectRepository = projectRepository;
        this.measurementRepository = measurementRepository;
        this.auditService = auditService;
        this.aiClientService = aiClientService;
    }

    @Transactional
    public RainfallObservation createRainfall(RecoveryDtos.RainfallRequest request, Actor actor) {
        if (request.latitude() != null && request.longitude() != null) {
            GeoUtil.validateCoordinates(request.latitude(), request.longitude());
        }
        RainfallObservation observation = new RainfallObservation();
        observation.setRainfallMm(request.rainfallMm());
        observation.setLocationLabel(request.locationLabel());
        observation.setLatitude(request.latitude());
        observation.setLongitude(request.longitude());
        observation.setObservedAt(request.observedAt());
        observation.setSourceNote(request.sourceNote());
        observation.setSyntheticDemo(false);
        observation = rainfallRepository.save(observation);
        auditService.record(actor, "CREATE_RAINFALL", "RainfallObservation", observation.getId().toString(), "User-supplied rainfall observation");
        return observation;
    }

    @Transactional
    public Catchment createCatchment(RecoveryDtos.CatchmentRequest request, Actor actor) {
        GeoUtil.validateCoordinates(request.latitude(), request.longitude());
        Catchment catchment = new Catchment();
        catchment.setName(request.name());
        catchment.setAreaSqM(request.areaSqM());
        catchment.setSurfaceType(request.surfaceType());
        catchment.setRunoffCoefficient(request.runoffCoefficient() != null
                ? request.runoffCoefficient()
                : defaultCoefficient(request.surfaceType()));
        catchment.setStorageCapacityM3(request.storageCapacityM3());
        catchment.setCollectionEfficiency(request.collectionEfficiency() != null
                ? request.collectionEfficiency()
                : new BigDecimal("0.80"));
        catchment.setProposedUse(request.proposedUse());
        catchment.setContaminationFlag(request.contaminationFlag());
        catchment.setLatitude(request.latitude());
        catchment.setLongitude(request.longitude());
        catchment.setSyntheticDemo(false);
        catchment = catchmentRepository.save(catchment);
        auditService.record(actor, "CREATE_CATCHMENT", "Catchment", catchment.getId().toString(), catchment.getName());
        return catchment;
    }

    @Transactional
    public RecoveryDtos.AssessmentView createAssessment(RecoveryDtos.AssessmentRequest request, Actor actor) {
        Catchment catchment = catchmentRepository.findById(request.catchmentId())
                .orElseThrow(() -> ApiException.notFound("Catchment not found"));
        BigDecimal rainfallMm = request.rainfallMm();
        RainfallObservation rainfall = null;
        if (request.rainfallObservationId() != null) {
            rainfall = rainfallRepository.findById(request.rainfallObservationId())
                    .orElseThrow(() -> ApiException.notFound("Rainfall observation not found"));
            rainfallMm = rainfall.getRainfallMm();
        }
        if (rainfallMm == null) {
            throw ApiException.badRequest("Provide rainfallMm or rainfallObservationId");
        }
        BigDecimal runoff = RunoffCalculator.theoreticalRunoffM3(rainfallMm, catchment.getAreaSqM(), catchment.getRunoffCoefficient());
        BigDecimal collectible = RunoffCalculator.potentiallyCollectibleM3(runoff, catchment.getCollectionEfficiency());
        BigDecimal constrained = RunoffCalculator.storageConstrainedM3(collectible, catchment.getStorageCapacityM3());

        RecoveryAssessment assessment = new RecoveryAssessment();
        assessment.setCatchment(catchment);
        assessment.setRainfallObservation(rainfall);
        assessment.setRainfallMm(rainfallMm);
        assessment.setTheoreticalRunoffM3(runoff);
        assessment.setPotentiallyCollectibleM3(collectible);
        assessment.setStorageConstrainedM3(constrained);
        assessment.setAssumptions(buildAssumptions(catchment, rainfallMm));
        assessment.setSafetyNotes(buildSafetyNotes(catchment));
        assessment.setReviewStatus(ReviewStatus.PENDING);
        assessment.setAutoApproved(false);
        assessment.setSyntheticDemo(false);
        assessment = assessmentRepository.save(assessment);

        aiClientService.post("/internal/v1/recovery/assess", Map.of(
                "rainfallMm", rainfallMm,
                "areaSqM", catchment.getAreaSqM(),
                "runoffCoefficient", catchment.getRunoffCoefficient(),
                "collectionEfficiency", catchment.getCollectionEfficiency(),
                "storageCapacityM3", catchment.getStorageCapacityM3(),
                "contaminationFlag", catchment.getContaminationFlag().name()
        ), "recovery-assess");
        auditService.record(actor, "CREATE_ASSESSMENT", "RecoveryAssessment", assessment.getId().toString(), "Estimate only; not approved");
        return toAssessment(assessment);
    }

    @Transactional(readOnly = true)
    public RecoveryDtos.AssessmentView getAssessment(UUID id) {
        return toAssessment(assessmentRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Recovery assessment not found")));
    }

    @Transactional
    public RecoveryDtos.ProjectView createProject(RecoveryDtos.ProjectRequest request, Actor actor) {
        RecoveryAssessment assessment = assessmentRepository.findById(request.assessmentId())
                .orElseThrow(() -> ApiException.notFound("Recovery assessment not found"));
        RecoveryProject project = new RecoveryProject();
        project.setAssessment(assessment);
        project.setTitle(request.title());
        project.setReviewStatus(ReviewStatus.PENDING);
        project.setSyntheticDemo(false);
        project = projectRepository.save(project);
        auditService.record(actor, "CREATE_PROJECT", "RecoveryProject", project.getId().toString(), request.title());
        return toProject(project);
    }

    @Transactional
    public RecoveryDtos.ProjectView review(UUID id, RecoveryDtos.ReviewRequest request, Actor actor) {
        RecoveryProject project = projectRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Recovery project not found"));
        Catchment catchment = project.getAssessment().getCatchment();
        if (request.reviewStatus() == ReviewStatus.APPROVED && isHighContamination(catchment.getContaminationFlag())) {
            throw ApiException.badRequest(
                    "Road runoff and indoor floodwater cannot be approved from a volume estimate alone. Mark as NEEDS_FURTHER_ASSESSMENT.");
        }
        project.setReviewStatus(request.reviewStatus());
        if (request.implementationStatus() != null) {
            project.setImplementationStatus(request.implementationStatus());
        }
        project.setReviewReason(request.reviewReason());
        project.setConstraints(request.constraints());
        projectRepository.save(project);
        project.getAssessment().setReviewStatus(request.reviewStatus());
        assessmentRepository.save(project.getAssessment());
        auditService.record(actor, "REVIEW_PROJECT", "RecoveryProject", id.toString(), request.reviewStatus().name());
        return toProject(project);
    }

    @Transactional
    public RecoveryDtos.MeasurementView measure(UUID id, RecoveryDtos.MeasurementRequest request, Actor actor) {
        RecoveryProject project = projectRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Recovery project not found"));
        RecoveryMeasurement measurement = new RecoveryMeasurement();
        measurement.setProject(project);
        measurement.setMeasuredVolumeM3(request.measuredVolumeM3());
        measurement.setMethod(request.method());
        measurement.setMeasuredAt(request.measuredAt());
        measurement.setRecordedBy(actor);
        measurement.setSyntheticDemo(false);
        measurementRepository.save(measurement);
        auditService.record(actor, "RECORD_MEASUREMENT", "RecoveryMeasurement", measurement.getId().toString(),
                request.measuredVolumeM3() + " m3");
        return toMeasurement(measurement);
    }

    public List<Catchment> listCatchments() {
        return catchmentRepository.findAll();
    }

    public List<RecoveryDtos.AssessmentView> listAssessments() {
        return assessmentRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toAssessment).toList();
    }

    public List<RecoveryDtos.ProjectView> listProjects() {
        return projectRepository.findAllByOrderByUpdatedAtDesc().stream().map(this::toProject).toList();
    }

    public static BigDecimal defaultCoefficient(SurfaceType surfaceType) {
        return switch (surfaceType) {
            case ROOF -> new BigDecimal("0.85");
            case PAVED_YARD -> new BigDecimal("0.80");
            case ROAD -> new BigDecimal("0.90");
            case GREEN_SPACE -> new BigDecimal("0.20");
            case MIXED -> new BigDecimal("0.55");
        };
    }

    private boolean isHighContamination(ContaminationFlag flag) {
        return flag == ContaminationFlag.ROAD_RUNOFF || flag == ContaminationFlag.INDOOR_FLOODWATER;
    }

    private String buildAssumptions(Catchment catchment, BigDecimal rainfallMm) {
        return "V = P × A × C / 1000. P=" + rainfallMm + " mm, A=" + catchment.getAreaSqM()
                + " m², C=" + catchment.getRunoffCoefficient()
                + ". Collection efficiency=" + catchment.getCollectionEfficiency()
                + " applied once after theoretical runoff. Storage constraint="
                + (catchment.getStorageCapacityM3() == null ? "none supplied" : catchment.getStorageCapacityM3() + " m³")
                + ". This is a calculated estimate, not measured capture.";
    }

    private String buildSafetyNotes(Catchment catchment) {
        return switch (catchment.getContaminationFlag()) {
            case ROAD_RUNOFF -> "Road runoff is potentially contaminated. Do not approve potable or untested reuse from this estimate.";
            case INDOOR_FLOODWATER -> "Indoor floodwater is potentially contaminated. Qualified testing and review are required.";
            case INDUSTRIAL_NEARBY -> "Industrial proximity requires contamination screening before any reuse or recharge decision.";
            case UNKNOWN -> "Contamination status is unknown. Treat as requiring further assessment.";
            case NONE_DECLARED -> "Reporter declared no known contamination source. This is a user claim, not a water-quality result. Do not treat water as potable.";
        };
    }

    public RecoveryDtos.AssessmentView toAssessment(RecoveryAssessment a) {
        return new RecoveryDtos.AssessmentView(
                a.getId(), a.getCatchment().getId(), a.getCatchment().getName(), a.getRainfallMm(),
                a.getTheoreticalRunoffM3(), a.getPotentiallyCollectibleM3(), a.getStorageConstrainedM3(),
                a.getAssumptions(), a.getSafetyNotes(), a.getReviewStatus(), a.isAutoApproved(),
                a.isSyntheticDemo(), a.getCreatedAt()
        );
    }

    public RecoveryDtos.ProjectView toProject(RecoveryProject p) {
        List<RecoveryDtos.MeasurementView> measurements = measurementRepository
                .findByProjectOrderByMeasuredAtDesc(p).stream().map(this::toMeasurement).toList();
        return new RecoveryDtos.ProjectView(
                p.getId(), p.getAssessment().getId(), p.getTitle(), p.getReviewStatus(),
                p.getImplementationStatus(), p.getReviewReason(), p.getConstraints(), p.isSyntheticDemo(), measurements
        );
    }

    private RecoveryDtos.MeasurementView toMeasurement(RecoveryMeasurement m) {
        return new RecoveryDtos.MeasurementView(m.getId(), m.getMeasuredVolumeM3(), m.getMethod(), m.getMeasuredAt(), m.isSyntheticDemo());
    }
}
