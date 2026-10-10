package com.jalloop.service;

import com.jalloop.config.AiServiceProperties;
import com.jalloop.entity.AiAnalysisRun;
import com.jalloop.enums.AnalysisMethod;
import com.jalloop.repository.AiAnalysisRunRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;
import java.util.Optional;

@Service
public class AiClientService {
    private static final Logger log = LoggerFactory.getLogger(AiClientService.class);
    private final RestClient restClient;
    private final AiAnalysisRunRepository analysisRunRepository;

    public AiClientService(AiServiceProperties properties, AiAnalysisRunRepository analysisRunRepository) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(properties.getTimeoutMs());
        factory.setReadTimeout(properties.getTimeoutMs());
        this.restClient = RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .requestFactory(factory)
                .build();
        this.analysisRunRepository = analysisRunRepository;
    }

    public Optional<Map> post(String path, Object body, String purpose) {
        try {
            Map response = restClient.post()
                    .uri(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            persist(purpose, AnalysisMethod.DETERMINISTIC_HEURISTIC, false, body.toString(), String.valueOf(response), null);
            return Optional.ofNullable(response);
        } catch (ResourceAccessException ex) {
            log.warn("AI service unreachable for {}: {}", purpose, ex.getMessage());
            persist(purpose, AnalysisMethod.UNAVAILABLE, true, String.valueOf(body), "{}", "AI service unreachable");
            return Optional.empty();
        } catch (RestClientException ex) {
            log.warn("AI service error for {}: {}", purpose, ex.getMessage());
            persist(purpose, AnalysisMethod.UNAVAILABLE, true, String.valueOf(body), "{}", "AI service error");
            return Optional.empty();
        }
    }

    public boolean health() {
        try {
            restClient.get().uri("/health").retrieve().toBodilessEntity();
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private void persist(String purpose, AnalysisMethod method, boolean fallback, String input, String output, String error) {
        try {
            AiAnalysisRun run = new AiAnalysisRun();
            run.setPurpose(purpose);
            run.setMethod(method);
            run.setUsedFallback(fallback);
            run.setInputSummary(truncate(input, 3900));
            run.setOutputJson(output == null ? "{}" : output);
            run.setErrorMessage(error);
            analysisRunRepository.save(run);
        } catch (Exception ex) {
            log.warn("Could not persist AI analysis run: {}", ex.getMessage());
        }
    }

    private String truncate(String value, int max) {
        if (value == null) {
            return "";
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
