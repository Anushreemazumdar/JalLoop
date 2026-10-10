package com.jalloop.entity;

import com.jalloop.enums.AnalysisMethod;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_analysis_runs")
public class AiAnalysisRun {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 64)
    private String purpose;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AnalysisMethod method;

    @Column(nullable = false)
    private boolean usedFallback;

    @Column(nullable = false, length = 4000)
    private String inputSummary;

    @Lob
    @Column(nullable = false)
    private String outputJson;

    @Column(length = 400)
    private String errorMessage;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public AnalysisMethod getMethod() { return method; }
    public void setMethod(AnalysisMethod method) { this.method = method; }
    public boolean isUsedFallback() { return usedFallback; }
    public void setUsedFallback(boolean usedFallback) { this.usedFallback = usedFallback; }
    public String getInputSummary() { return inputSummary; }
    public void setInputSummary(String inputSummary) { this.inputSummary = inputSummary; }
    public String getOutputJson() { return outputJson; }
    public void setOutputJson(String outputJson) { this.outputJson = outputJson; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
