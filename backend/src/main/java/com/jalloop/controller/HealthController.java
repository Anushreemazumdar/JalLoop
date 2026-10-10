package com.jalloop.controller;

import com.jalloop.service.AiClientService;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HealthController {
    private final Environment environment;
    private final AiClientService aiClientService;

    public HealthController(Environment environment, AiClientService aiClientService) {
        this.environment = environment;
        this.aiClientService = aiClientService;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "service", "jalloop-backend",
                "time", Instant.now().toString(),
                "profiles", Arrays.asList(environment.getActiveProfiles()),
                "aiServiceReachable", aiClientService.health()
        );
    }

    @GetMapping("/meta")
    public Map<String, Object> meta() {
        return Map.of(
                "demoActors", new String[]{"demo-citizen", "demo-inspector", "demo-admin"},
                "header", "X-Actor-Key",
                "usingSyntheticDemonstrationData", true,
                "note", "Switch actor via the demo role control. Administrative APIs require demo-admin."
        );
    }
}
