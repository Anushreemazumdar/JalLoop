package com.jalloop.entity;

import com.jalloop.enums.IncidentCategory;
import com.jalloop.enums.LocationType;
import com.jalloop.enums.Severity;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "citizen_reports", indexes = {
        @Index(name = "idx_report_incident", columnList = "incident_id"),
        @Index(name = "idx_report_observed", columnList = "observedAt")
})
public class CitizenReport {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id")
    private Incident incident;

    @ManyToOne(fetch = FetchType.LAZY)
    private Actor reporter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private IncidentCategory category;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private Severity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private LocationType locationType;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false)
    private Instant observedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private boolean syntheticDemo;

    @Column(length = 240)
    private String photoNote;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Incident getIncident() { return incident; }
    public void setIncident(Incident incident) { this.incident = incident; }
    public Actor getReporter() { return reporter; }
    public void setReporter(Actor reporter) { this.reporter = reporter; }
    public IncidentCategory getCategory() { return category; }
    public void setCategory(IncidentCategory category) { this.category = category; }
    public Severity getSeverity() { return severity; }
    public void setSeverity(Severity severity) { this.severity = severity; }
    public LocationType getLocationType() { return locationType; }
    public void setLocationType(LocationType locationType) { this.locationType = locationType; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Instant getObservedAt() { return observedAt; }
    public void setObservedAt(Instant observedAt) { this.observedAt = observedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public boolean isSyntheticDemo() { return syntheticDemo; }
    public void setSyntheticDemo(boolean syntheticDemo) { this.syntheticDemo = syntheticDemo; }
    public String getPhotoNote() { return photoNote; }
    public void setPhotoNote(String photoNote) { this.photoNote = photoNote; }
}
