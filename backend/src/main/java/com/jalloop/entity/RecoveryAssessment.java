package com.jalloop.entity;

import com.jalloop.enums.ReviewStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "recovery_assessments")
public class RecoveryAssessment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Catchment catchment;

    @ManyToOne(fetch = FetchType.LAZY)
    private RainfallObservation rainfallObservation;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal rainfallMm;

    @Column(nullable = false, precision = 14, scale = 4)
    private BigDecimal theoreticalRunoffM3;

    @Column(nullable = false, precision = 14, scale = 4)
    private BigDecimal potentiallyCollectibleM3;

    @Column(nullable = false, precision = 14, scale = 4)
    private BigDecimal storageConstrainedM3;

    @Column(nullable = false, length = 2000)
    private String assumptions;

    @Column(nullable = false, length = 2000)
    private String safetyNotes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ReviewStatus reviewStatus = ReviewStatus.PENDING;

    @Column(nullable = false)
    private boolean autoApproved = false;

    @Column(nullable = false)
    private boolean syntheticDemo;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Catchment getCatchment() { return catchment; }
    public void setCatchment(Catchment catchment) { this.catchment = catchment; }
    public RainfallObservation getRainfallObservation() { return rainfallObservation; }
    public void setRainfallObservation(RainfallObservation rainfallObservation) { this.rainfallObservation = rainfallObservation; }
    public BigDecimal getRainfallMm() { return rainfallMm; }
    public void setRainfallMm(BigDecimal rainfallMm) { this.rainfallMm = rainfallMm; }
    public BigDecimal getTheoreticalRunoffM3() { return theoreticalRunoffM3; }
    public void setTheoreticalRunoffM3(BigDecimal theoreticalRunoffM3) { this.theoreticalRunoffM3 = theoreticalRunoffM3; }
    public BigDecimal getPotentiallyCollectibleM3() { return potentiallyCollectibleM3; }
    public void setPotentiallyCollectibleM3(BigDecimal potentiallyCollectibleM3) { this.potentiallyCollectibleM3 = potentiallyCollectibleM3; }
    public BigDecimal getStorageConstrainedM3() { return storageConstrainedM3; }
    public void setStorageConstrainedM3(BigDecimal storageConstrainedM3) { this.storageConstrainedM3 = storageConstrainedM3; }
    public String getAssumptions() { return assumptions; }
    public void setAssumptions(String assumptions) { this.assumptions = assumptions; }
    public String getSafetyNotes() { return safetyNotes; }
    public void setSafetyNotes(String safetyNotes) { this.safetyNotes = safetyNotes; }
    public ReviewStatus getReviewStatus() { return reviewStatus; }
    public void setReviewStatus(ReviewStatus reviewStatus) { this.reviewStatus = reviewStatus; }
    public boolean isAutoApproved() { return autoApproved; }
    public void setAutoApproved(boolean autoApproved) { this.autoApproved = autoApproved; }
    public boolean isSyntheticDemo() { return syntheticDemo; }
    public void setSyntheticDemo(boolean syntheticDemo) { this.syntheticDemo = syntheticDemo; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
