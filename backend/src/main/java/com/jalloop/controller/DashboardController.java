package com.jalloop.controller;

import com.jalloop.dto.DashboardDtos;
import com.jalloop.service.DashboardService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class DashboardController {
    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/dashboard/summary")
    public DashboardDtos.Summary summary() {
        return dashboardService.summary();
    }

    @GetMapping("/dashboard/hotspots")
    public List<DashboardDtos.Hotspot> hotspots() {
        return dashboardService.hotspots();
    }

    @GetMapping("/dashboard/recovery")
    public DashboardDtos.RecoveryOverview recovery() {
        return dashboardService.recovery();
    }

    @PostMapping("/incidents/{id}/explain")
    public DashboardDtos.ExplainResponse explain(@PathVariable UUID id) {
        return dashboardService.explain(id);
    }
}
