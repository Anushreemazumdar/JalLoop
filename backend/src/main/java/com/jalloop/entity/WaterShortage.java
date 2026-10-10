package com.jalloop.entity;

import com.jalloop.enums.Severity;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "water_shortages", indexes = {
        @Index(name = "idx_shortage_severity", columnList = "severity")
})
public class WaterShortage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Actor reporter;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(length = 240)
    private String locationLabel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Severity severity;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false)
    private Instant observedAt;

    @Column(precision = 12, scale = 2)
    private BigDecimal estimatedAffectedDemandM3PerDay;

    @Column(nullable = false)
    private boolean syntheticDemo;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(length = 32)
    private String heuristicPriorityBand;

    @Column(precision = 6, scale = 3)
    private BigDecimal heuristicPriorityScore;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Actor getReporter() { return reporter; }
    public void setReporter(Actor reporter) { this.reporter = reporter; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    public String getLocationLabel() { return locationLabel; }
    public void setLocationLabel(String locationLabel) { this.locationLabel = locationLabel; }
    public Severity getSeverity() { return severity; }
    public void setSeverity(Severity severity) { this.severity = severity; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Instant getObservedAt() { return observedAt; }
    public void setObservedAt(Instant observedAt) { this.observedAt = observedAt; }
    public BigDecimal getEstimatedAffectedDemandM3PerDay() { return estimatedAffectedDemandM3PerDay; }
    public void setEstimatedAffectedDemandM3PerDay(BigDecimal estimatedAffectedDemandM3PerDay) {
        this.estimatedAffectedDemandM3PerDay = estimatedAffectedDemandM3PerDay;
    }
    public boolean isSyntheticDemo() { return syntheticDemo; }
    public void setSyntheticDemo(boolean syntheticDemo) { this.syntheticDemo = syntheticDemo; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public String getHeuristicPriorityBand() { return heuristicPriorityBand; }
    public void setHeuristicPriorityBand(String heuristicPriorityBand) { this.heuristicPriorityBand = heuristicPriorityBand; }
    public BigDecimal getHeuristicPriorityScore() { return heuristicPriorityScore; }
    public void setHeuristicPriorityScore(BigDecimal heuristicPriorityScore) { this.heuristicPriorityScore = heuristicPriorityScore; }
}
