package com.jalloop.controller;

import com.jalloop.config.DemoAuthInterceptor;
import com.jalloop.dto.RecoveryDtos;
import com.jalloop.entity.Catchment;
import com.jalloop.entity.RainfallObservation;
import com.jalloop.service.RecoveryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class RecoveryController {
    private final RecoveryService recoveryService;

    public RecoveryController(RecoveryService recoveryService) {
        this.recoveryService = recoveryService;
    }

    @PostMapping("/rainfall-observations")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> rainfall(
            @Valid @RequestBody RecoveryDtos.RainfallRequest request,
            HttpServletRequest http
    ) {
        RainfallObservation observation = recoveryService.createRainfall(request, DemoAuthInterceptor.current(http));
        return Map.of(
                "id", observation.getId(),
                "rainfallMm", observation.getRainfallMm(),
                "sourceNote", observation.getSourceNote(),
                "syntheticDemo", observation.isSyntheticDemo(),
                "kind", "USER_CLAIM_OR_SYNTHETIC"
        );
    }

    @PostMapping("/catchments")
    @ResponseStatus(HttpStatus.CREATED)
    public Catchment catchment(
            @Valid @RequestBody RecoveryDtos.CatchmentRequest request,
            HttpServletRequest http
    ) {
        return recoveryService.createCatchment(request, DemoAuthInterceptor.current(http));
    }

    @GetMapping("/catchments")
    public List<Catchment> catchments() {
        return recoveryService.listCatchments();
    }

    @PostMapping("/recovery-assessments")
    @ResponseStatus(HttpStatus.CREATED)
    public RecoveryDtos.AssessmentView assess(
            @Valid @RequestBody RecoveryDtos.AssessmentRequest request,
            HttpServletRequest http
    ) {
        return recoveryService.createAssessment(request, DemoAuthInterceptor.current(http));
    }

    @GetMapping("/recovery-assessments")
    public List<RecoveryDtos.AssessmentView> assessments() {
        return recoveryService.listAssessments();
    }

    @GetMapping("/recovery-assessments/{id}")
    public RecoveryDtos.AssessmentView assessment(@PathVariable UUID id) {
        return recoveryService.getAssessment(id);
    }

    @PostMapping("/recovery-projects")
    @ResponseStatus(HttpStatus.CREATED)
    public RecoveryDtos.ProjectView project(
            @Valid @RequestBody RecoveryDtos.ProjectRequest request,
            HttpServletRequest http
    ) {
        DemoAuthInterceptor.requireAdmin(http);
        return recoveryService.createProject(request, DemoAuthInterceptor.current(http));
    }

    @GetMapping("/recovery-projects")
    public List<RecoveryDtos.ProjectView> projects() {
        return recoveryService.listProjects();
    }

    @PatchMapping("/recovery-projects/{id}/review")
    public RecoveryDtos.ProjectView review(
            @PathVariable UUID id,
            @Valid @RequestBody RecoveryDtos.ReviewRequest request,
            HttpServletRequest http
    ) {
        DemoAuthInterceptor.requireAdmin(http);
        return recoveryService.review(id, request, DemoAuthInterceptor.current(http));
    }

    @PostMapping("/recovery-projects/{id}/measurements")
    @ResponseStatus(HttpStatus.CREATED)
    public RecoveryDtos.MeasurementView measure(
            @PathVariable UUID id,
            @Valid @RequestBody RecoveryDtos.MeasurementRequest request,
            HttpServletRequest http
    ) {
        DemoAuthInterceptor.requireAdmin(http);
        return recoveryService.measure(id, request, DemoAuthInterceptor.current(http));
    }
}
