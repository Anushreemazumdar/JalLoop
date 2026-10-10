package com.jalloop;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class IncidentApiTest {
    @Autowired
    MockMvc mockMvc;
    @Autowired
    ObjectMapper objectMapper;

    @Test
    void healthIsUp() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void createIncidentRejectsInvalidLatitude() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "category", "PIPE_LEAK",
                "description", "Leak",
                "latitude", 120,
                "longitude", 73.8,
                "locationType", "ROAD",
                "observedAt", Instant.now().toString()
        ));
        mockMvc.perform(post("/api/v1/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Actor-Key", "demo-citizen")
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void createIncidentRequiresDescription() throws Exception {
        String body = """
                {"category":"PIPE_LEAK","description":"","latitude":18.5,"longitude":73.8,"locationType":"ROAD","observedAt":"%s"}
                """.formatted(Instant.now());
        mockMvc.perform(post("/api/v1/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Actor-Key", "demo-citizen")
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createAndRetrieveIncident() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "category", "BLOCKED_DRAIN",
                "description", "Blocked drain near a labelled demonstration street.",
                "latitude", 18.51,
                "longitude", 73.85,
                "locationType", "OPEN_DRAIN",
                "severity", "MODERATE",
                "observedAt", Instant.now().toString(),
                "locationLabel", "test drain"
        ));
        MvcResult created = mockMvc.perform(post("/api/v1/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Actor-Key", "demo-citizen")
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.incidentId").exists())
                .andExpect(jsonPath("$.status").value("REPORTED"))
                .andReturn();
        String id = objectMapper.readTree(created.getResponse().getContentAsString()).get("incidentId").asText();
        mockMvc.perform(get("/api/v1/incidents/" + id).header("X-Actor-Key", "demo-citizen"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.incident.id").value(id))
                .andExpect(jsonPath("$.reports").isArray());
    }

    @Test
    void citizenCannotAssign() throws Exception {
        mockMvc.perform(get("/api/v1/incidents").header("X-Actor-Key", "demo-citizen"))
                .andExpect(status().isOk());
        String list = mockMvc.perform(get("/api/v1/incidents").header("X-Actor-Key", "demo-citizen"))
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(list).get("items").get(0).get("id").asText();
        mockMvc.perform(post("/api/v1/incidents/" + id + "/assignments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Actor-Key", "demo-citizen")
                        .content("""
                                {"assigneeActorKey":"demo-inspector","note":"please inspect"}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void dashboardKeepsEstimatedAndVerifiedSeparate() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/summary").header("X-Actor-Key", "demo-admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estimatedPotentiallyRecoverableM3").exists())
                .andExpect(jsonPath("$.verifiedRecoveredM3").exists())
                .andExpect(jsonPath("$.usingSyntheticDemonstrationData").value(true));
    }

    @Test
    void recoveryReviewRejectsRoadRunoffApproval() throws Exception {
        String catchment = objectMapper.writeValueAsString(Map.of(
                "name", "road-runoff-test",
                "areaSqM", 100,
                "surfaceType", "ROAD",
                "runoffCoefficient", 0.9,
                "storageCapacityM3", 5,
                "collectionEfficiency", 0.8,
                "proposedUse", "unknown",
                "contaminationFlag", "ROAD_RUNOFF",
                "latitude", 18.5,
                "longitude", 73.8
        ));
        MvcResult catchmentResult = mockMvc.perform(post("/api/v1/catchments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Actor-Key", "demo-admin")
                        .content(catchment))
                .andExpect(status().isCreated())
                .andReturn();
        String catchmentId = objectMapper.readTree(catchmentResult.getResponse().getContentAsString()).get("id").asText();
        MvcResult assessmentResult = mockMvc.perform(post("/api/v1/recovery-assessments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Actor-Key", "demo-admin")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "catchmentId", catchmentId,
                                "rainfallMm", 10
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        String assessmentId = objectMapper.readTree(assessmentResult.getResponse().getContentAsString()).get("id").asText();
        MvcResult projectResult = mockMvc.perform(post("/api/v1/recovery-projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Actor-Key", "demo-admin")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "assessmentId", assessmentId,
                                "title", "road runoff candidate"
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        String projectId = objectMapper.readTree(projectResult.getResponse().getContentAsString()).get("id").asText();
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                                "/api/v1/recovery-projects/" + projectId + "/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Actor-Key", "demo-admin")
                        .content("""
                                {"reviewStatus":"APPROVED","reviewReason":"numbers look fine"}
                                """))
                .andExpect(status().isBadRequest());
    }
}
