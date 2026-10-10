package com.jalloop.controller;

import com.jalloop.config.DemoAuthInterceptor;
import com.jalloop.dto.IncidentDtos;
import com.jalloop.enums.IncidentCategory;
import com.jalloop.enums.IncidentStatus;
import com.jalloop.enums.Severity;
import com.jalloop.service.IncidentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/incidents")
public class IncidentController {
    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IncidentDtos.CreateIncidentResponse create(
            @Valid @RequestBody IncidentDtos.CreateIncidentRequest request,
            HttpServletRequest http
    ) {
        return incidentService.create(request, DemoAuthInterceptor.current(http));
    }

    @GetMapping
    public IncidentDtos.IncidentPage list(
            @RequestParam(required = false) IncidentCategory category,
            @RequestParam(required = false) IncidentStatus status,
            @RequestParam(required = false) Severity severity,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return incidentService.list(category, status, severity, page, Math.min(size, 100));
    }

    @GetMapping("/{id}")
    public IncidentDtos.IncidentDetail get(@PathVariable UUID id) {
        return incidentService.get(id);
    }

    @PatchMapping("/{id}/status")
    public IncidentDtos.IncidentSummary patchStatus(
            @PathVariable UUID id,
            @Valid @RequestBody IncidentDtos.StatusPatchRequest request,
            HttpServletRequest http
    ) {
        DemoAuthInterceptor.requireAdmin(http);
        return incidentService.updateStatus(id, request, DemoAuthInterceptor.current(http));
    }

    @PostMapping("/{id}/assignments")
    @ResponseStatus(HttpStatus.CREATED)
    public IncidentDtos.AssignmentView assign(
            @PathVariable UUID id,
            @Valid @RequestBody IncidentDtos.AssignmentRequest request,
            HttpServletRequest http
    ) {
        DemoAuthInterceptor.requireAdmin(http);
        return incidentService.assign(id, request, DemoAuthInterceptor.current(http));
    }

    @PostMapping("/{id}/inspections")
    @ResponseStatus(HttpStatus.CREATED)
    public IncidentDtos.InspectionView inspect(
            @PathVariable UUID id,
            @Valid @RequestBody IncidentDtos.InspectionRequest request,
            HttpServletRequest http
    ) {
        DemoAuthInterceptor.requireStaff(http);
        return incidentService.inspect(id, request, DemoAuthInterceptor.current(http));
    }

    @PostMapping("/{id}/verifications")
    @ResponseStatus(HttpStatus.CREATED)
    public IncidentDtos.VerificationView verify(
            @PathVariable UUID id,
            @Valid @RequestBody IncidentDtos.VerificationRequest request,
            HttpServletRequest http
    ) {
        DemoAuthInterceptor.requireAdmin(http);
        return incidentService.verify(id, request, DemoAuthInterceptor.current(http));
    }
}
