package com.jalloop.service;

import com.jalloop.entity.*;
import com.jalloop.enums.*;
import com.jalloop.repository.*;
import com.jalloop.util.RunoffCalculator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class DemoSeedService implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DemoSeedService.class);
    private final ActorRepository actorRepository;
    private final IncidentRepository incidentRepository;
    private final CitizenReportRepository reportRepository;
    private final IncidentStatusHistoryRepository statusHistoryRepository;
    private final WaterShortageRepository shortageRepository;
    private final RainfallObservationRepository rainfallRepository;
    private final CatchmentRepository catchmentRepository;
    private final RecoveryAssessmentRepository assessmentRepository;
    private final RecoveryProjectRepository projectRepository;
    private final ShortageService shortageService;

    public DemoSeedService(
            ActorRepository actorRepository,
            IncidentRepository incidentRepository,
            CitizenReportRepository reportRepository,
            IncidentStatusHistoryRepository statusHistoryRepository,
            WaterShortageRepository shortageRepository,
            RainfallObservationRepository rainfallRepository,
            CatchmentRepository catchmentRepository,
            RecoveryAssessmentRepository assessmentRepository,
            RecoveryProjectRepository projectRepository,
            ShortageService shortageService
    ) {
        this.actorRepository = actorRepository;
        this.incidentRepository = incidentRepository;
        this.reportRepository = reportRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.shortageRepository = shortageRepository;
        this.rainfallRepository = rainfallRepository;
        this.catchmentRepository = catchmentRepository;
        this.assessmentRepository = assessmentRepository;
        this.projectRepository = projectRepository;
        this.shortageService = shortageService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Actor citizen = upsertActor("demo-citizen", "Demo Citizen", ActorRole.CITIZEN);
        Actor inspector = upsertActor("demo-inspector", "Demo Inspector", ActorRole.INSPECTOR);
        Actor admin = upsertActor("demo-admin", "Demo Administrator", ActorRole.ADMIN);

        if (incidentRepository.countBySyntheticDemoTrue() > 0) {
            log.info("Synthetic demonstration data already present; skipping incident seed.");
            return;
        }

        Instant now = Instant.now();
        // Recurring waterlogging near a labelled synthetic point in Pune (illustrative only).
        seedIncident(citizen, IncidentCategory.WATERLOGGING, Severity.HIGH, LocationType.ROAD,
                bd("18.5204000"), bd("73.8567000"), "SYNTHETIC: FC Road underpass (illustrative)",
                "Standing water after rainfall. Synthetic demonstration record, not a confirmed civic observation.",
                now.minus(40, ChronoUnit.DAYS), IncidentStatus.IN_PROGRESS);
        seedIncident(citizen, IncidentCategory.WATERLOGGING, Severity.MODERATE, LocationType.ROAD,
                bd("18.5206000"), bd("73.8569000"), "SYNTHETIC: FC Road underpass (illustrative)",
                "Second synthetic waterlogging report at the same labelled hotspot.",
                now.minus(12, ChronoUnit.DAYS), IncidentStatus.REPORTED);
        seedIncident(citizen, IncidentCategory.PIPE_LEAK, Severity.HIGH, LocationType.RESIDENTIAL_PROPERTY,
                bd("18.5310000"), bd("73.8440000"), "SYNTHETIC: Model Colony lane (illustrative)",
                "Visible pipe leak on a residential lane. Synthetic demonstration record.",
                now.minus(5, ChronoUnit.DAYS), IncidentStatus.ASSIGNED);
        seedIncident(citizen, IncidentCategory.BLOCKED_DRAIN, Severity.MODERATE, LocationType.OPEN_DRAIN,
                bd("18.5089000"), bd("73.8553000"), "SYNTHETIC: market drain (illustrative)",
                "Blocked roadside drain. Synthetic demonstration record.",
                now.minus(2, ChronoUnit.DAYS), IncidentStatus.UNDER_REVIEW);

        WaterShortage shortage = new WaterShortage();
        shortage.setReporter(citizen);
        shortage.setLatitude(bd("18.5074000"));
        shortage.setLongitude(bd("73.8077000"));
        shortage.setLocationLabel("SYNTHETIC: ward tap cluster (illustrative)");
        shortage.setSeverity(Severity.HIGH);
        shortage.setDescription("Intermittent supply reported in a synthetic demonstration shortage. Not an official demand figure.");
        shortage.setObservedAt(now.minus(18, ChronoUnit.HOURS));
        shortage.setEstimatedAffectedDemandM3PerDay(new BigDecimal("12.50"));
        shortage.setSyntheticDemo(true);
        shortageService.applyHeuristic(shortage);
        shortageRepository.save(shortage);

        RainfallObservation rain = new RainfallObservation();
        rain.setRainfallMm(new BigDecimal("20.00"));
        rain.setLocationLabel("SYNTHETIC: user-entered example rainfall");
        rain.setLatitude(bd("18.5204000"));
        rain.setLongitude(bd("73.8567000"));
        rain.setObservedAt(now.minus(3, ChronoUnit.DAYS));
        rain.setSourceNote("Synthetic demonstration input, not a weather-station reading");
        rain.setSyntheticDemo(true);
        rainfallRepository.save(rain);

        Catchment catchment = new Catchment();
        catchment.setName("SYNTHETIC school roof catchment");
        catchment.setAreaSqM(new BigDecimal("1000.00"));
        catchment.setSurfaceType(SurfaceType.ROOF);
        catchment.setRunoffCoefficient(new BigDecimal("0.800"));
        catchment.setStorageCapacityM3(new BigDecimal("10.00"));
        catchment.setCollectionEfficiency(new BigDecimal("0.800"));
        catchment.setProposedUse("Non-potable flushing / gardening — candidate only");
        catchment.setContaminationFlag(ContaminationFlag.NONE_DECLARED);
        catchment.setLatitude(bd("18.5290000"));
        catchment.setLongitude(bd("73.8500000"));
        catchment.setSyntheticDemo(true);
        catchmentRepository.save(catchment);

        BigDecimal runoff = RunoffCalculator.theoreticalRunoffM3(rain.getRainfallMm(), catchment.getAreaSqM(), catchment.getRunoffCoefficient());
        BigDecimal collectible = RunoffCalculator.potentiallyCollectibleM3(runoff, catchment.getCollectionEfficiency());
        BigDecimal constrained = RunoffCalculator.storageConstrainedM3(collectible, catchment.getStorageCapacityM3());

        RecoveryAssessment assessment = new RecoveryAssessment();
        assessment.setCatchment(catchment);
        assessment.setRainfallObservation(rain);
        assessment.setRainfallMm(rain.getRainfallMm());
        assessment.setTheoreticalRunoffM3(runoff);
        assessment.setPotentiallyCollectibleM3(collectible);
        assessment.setStorageConstrainedM3(constrained);
        assessment.setAssumptions("V = 20 × 1000 × 0.8 / 1000 = 16 m³ theoretical runoff. Efficiency 0.8 then storage cap 10 m³. Synthetic example.");
        assessment.setSafetyNotes("Numerical estimate only. Not labelled safe or approved. Do not treat as potable.");
        assessment.setReviewStatus(ReviewStatus.PENDING);
        assessment.setSyntheticDemo(true);
        assessmentRepository.save(assessment);

        RecoveryProject project = new RecoveryProject();
        project.setAssessment(assessment);
        project.setTitle("SYNTHETIC roof-tank candidate awaiting review");
        project.setReviewStatus(ReviewStatus.PENDING);
        project.setImplementationStatus(ImplementationStatus.PROPOSED);
        project.setReviewReason(null);
        project.setConstraints("Requires human review; no automatic approval.");
        project.setSyntheticDemo(true);
        projectRepository.save(project);

        log.info("Loaded synthetic demonstration actors (citizen/inspector/admin={}/{}/{}) and seed rows.",
                citizen.getActorKey(), inspector.getActorKey(), admin.getActorKey());
    }

    private Actor upsertActor(String key, String name, ActorRole role) {
        return actorRepository.findByActorKey(key).orElseGet(() -> {
            Actor actor = new Actor();
            actor.setActorKey(key);
            actor.setDisplayName(name);
            actor.setRole(role);
            actor.setSyntheticDemo(true);
            return actorRepository.save(actor);
        });
    }

    private void seedIncident(
            Actor reporter,
            IncidentCategory category,
            Severity severity,
            LocationType locationType,
            BigDecimal lat,
            BigDecimal lon,
            String label,
            String description,
            Instant observedAt,
            IncidentStatus status
    ) {
        Incident incident = new Incident();
        incident.setCategory(category);
        incident.setStatus(status);
        incident.setSeverity(severity);
        incident.setLocationType(locationType);
        incident.setLatitude(lat);
        incident.setLongitude(lon);
        incident.setLocationLabel(label);
        incident.setSummary(description);
        incident.setFirstObservedAt(observedAt);
        incident.setLastObservedAt(observedAt);
        incident.setSyntheticDemo(true);
        incident.setSuspectedDuplicate(false);
        incident.setRecommendedNextAction("Synthetic record. Inspect recurrence before committing maintenance budget.");
        incident = incidentRepository.save(incident);

        IncidentStatusHistory history = new IncidentStatusHistory();
        history.setIncident(incident);
        history.setFromStatus(null);
        history.setToStatus(status);
        history.setChangedBy(reporter);
        history.setReason("Synthetic seed");
        statusHistoryRepository.save(history);

        CitizenReport report = new CitizenReport();
        report.setIncident(incident);
        report.setReporter(reporter);
        report.setCategory(category);
        report.setSeverity(severity);
        report.setLocationType(locationType);
        report.setLatitude(lat);
        report.setLongitude(lon);
        report.setDescription(description);
        report.setObservedAt(observedAt);
        report.setSyntheticDemo(true);
        report.setPhotoNote("No photo stored. Uploads are not implemented.");
        reportRepository.save(report);
    }

    private BigDecimal bd(String value) {
        return new BigDecimal(value);
    }
}
