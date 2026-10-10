package com.jalloop.entity;

import com.jalloop.enums.IncidentCategory;
import com.jalloop.enums.IncidentStatus;
import com.jalloop.enums.LocationType;
import com.jalloop.enums.Severity;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "incidents", indexes = {
        @Index(name = "idx_incident_status", columnList = "status"),
        @Index(name = "idx_incident_category", columnList = "category"),
        @Index(name = "idx_incident_coords", columnList = "latitude,longitude")
})
public class Incident {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private IncidentCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private IncidentStatus status = IncidentStatus.REPORTED;

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

    @Column(length = 240)
    private String locationLabel;

    @Column(nullable = false, length = 2000)
    private String summary;

    @Column(nullable = false)
    private Instant firstObservedAt;

    @Column(nullable = false)
    private Instant lastObservedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Column(nullable = false)
    private boolean syntheticDemo;

    @Column(nullable = false)
    private boolean suspectedDuplicate;

    @ManyToOne(fetch = FetchType.LAZY)
    private Incident duplicateOf;

    @Column(length = 400)
    private String recommendedNextAction;

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CitizenReport> reports = new ArrayList<>();

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public IncidentCategory getCategory() { return category; }
    public void setCategory(IncidentCategory category) { this.category = category; }
    public IncidentStatus getStatus() { return status; }
    public void setStatus(IncidentStatus status) { this.status = status; }
    public Severity getSeverity() { return severity; }
    public void setSeverity(Severity severity) { this.severity = severity; }
    public LocationType getLocationType() { return locationType; }
    public void setLocationType(LocationType locationType) { this.locationType = locationType; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    public String getLocationLabel() { return locationLabel; }
    public void setLocationLabel(String locationLabel) { this.locationLabel = locationLabel; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public Instant getFirstObservedAt() { return firstObservedAt; }
    public void setFirstObservedAt(Instant firstObservedAt) { this.firstObservedAt = firstObservedAt; }
    public Instant getLastObservedAt() { return lastObservedAt; }
    public void setLastObservedAt(Instant lastObservedAt) { this.lastObservedAt = lastObservedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public boolean isSyntheticDemo() { return syntheticDemo; }
    public void setSyntheticDemo(boolean syntheticDemo) { this.syntheticDemo = syntheticDemo; }
    public boolean isSuspectedDuplicate() { return suspectedDuplicate; }
    public void setSuspectedDuplicate(boolean suspectedDuplicate) { this.suspectedDuplicate = suspectedDuplicate; }
    public Incident getDuplicateOf() { return duplicateOf; }
    public void setDuplicateOf(Incident duplicateOf) { this.duplicateOf = duplicateOf; }
    public String getRecommendedNextAction() { return recommendedNextAction; }
    public void setRecommendedNextAction(String recommendedNextAction) { this.recommendedNextAction = recommendedNextAction; }
    public List<CitizenReport> getReports() { return reports; }
    public void setReports(List<CitizenReport> reports) { this.reports = reports; }
}
