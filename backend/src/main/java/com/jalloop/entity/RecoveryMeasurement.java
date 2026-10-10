package com.jalloop.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "recovery_measurements")
public class RecoveryMeasurement {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private RecoveryProject project;

    @Column(nullable = false, precision = 14, scale = 4)
    private BigDecimal measuredVolumeM3;

    @Column(nullable = false, length = 240)
    private String method;

    @Column(nullable = false)
    private Instant measuredAt;

    @ManyToOne(fetch = FetchType.LAZY)
    private Actor recordedBy;

    @Column(nullable = false)
    private boolean syntheticDemo;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public RecoveryProject getProject() { return project; }
    public void setProject(RecoveryProject project) { this.project = project; }
    public BigDecimal getMeasuredVolumeM3() { return measuredVolumeM3; }
    public void setMeasuredVolumeM3(BigDecimal measuredVolumeM3) { this.measuredVolumeM3 = measuredVolumeM3; }
    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
    public Instant getMeasuredAt() { return measuredAt; }
    public void setMeasuredAt(Instant measuredAt) { this.measuredAt = measuredAt; }
    public Actor getRecordedBy() { return recordedBy; }
    public void setRecordedBy(Actor recordedBy) { this.recordedBy = recordedBy; }
    public boolean isSyntheticDemo() { return syntheticDemo; }
    public void setSyntheticDemo(boolean syntheticDemo) { this.syntheticDemo = syntheticDemo; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
