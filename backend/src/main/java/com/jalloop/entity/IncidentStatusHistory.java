package com.jalloop.entity;

import com.jalloop.enums.IncidentStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incident_status_history", indexes = {
        @Index(name = "idx_status_hist_incident", columnList = "incident_id")
})
public class IncidentStatusHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Incident incident;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private IncidentStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private IncidentStatus toStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    private Actor changedBy;

    @Column(length = 400)
    private String reason;

    @Column(nullable = false)
    private Instant changedAt;

    @PrePersist
    void onCreate() { changedAt = Instant.now(); }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Incident getIncident() { return incident; }
    public void setIncident(Incident incident) { this.incident = incident; }
    public IncidentStatus getFromStatus() { return fromStatus; }
    public void setFromStatus(IncidentStatus fromStatus) { this.fromStatus = fromStatus; }
    public IncidentStatus getToStatus() { return toStatus; }
    public void setToStatus(IncidentStatus toStatus) { this.toStatus = toStatus; }
    public Actor getChangedBy() { return changedBy; }
    public void setChangedBy(Actor changedBy) { this.changedBy = changedBy; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public Instant getChangedAt() { return changedAt; }
    public void setChangedAt(Instant changedAt) { this.changedAt = changedAt; }
}
