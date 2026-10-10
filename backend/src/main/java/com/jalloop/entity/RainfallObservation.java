package com.jalloop.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rainfall_observations")
public class RainfallObservation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal rainfallMm;

    @Column(length = 240)
    private String locationLabel;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(nullable = false)
    private Instant observedAt;

    @Column(nullable = false, length = 80)
    private String sourceNote;

    @Column(nullable = false)
    private boolean syntheticDemo;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public BigDecimal getRainfallMm() { return rainfallMm; }
    public void setRainfallMm(BigDecimal rainfallMm) { this.rainfallMm = rainfallMm; }
    public String getLocationLabel() { return locationLabel; }
    public void setLocationLabel(String locationLabel) { this.locationLabel = locationLabel; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    public Instant getObservedAt() { return observedAt; }
    public void setObservedAt(Instant observedAt) { this.observedAt = observedAt; }
    public String getSourceNote() { return sourceNote; }
    public void setSourceNote(String sourceNote) { this.sourceNote = sourceNote; }
    public boolean isSyntheticDemo() { return syntheticDemo; }
    public void setSyntheticDemo(boolean syntheticDemo) { this.syntheticDemo = syntheticDemo; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
