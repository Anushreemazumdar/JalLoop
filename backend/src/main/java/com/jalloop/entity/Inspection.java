package com.jalloop.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "inspections")
public class Inspection {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Incident incident;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Actor inspector;

    @Column(nullable = false, length = 2000)
    private String findings;

    @Column(length = 400)
    private String suspectedCause;

    @Column(nullable = false)
    private Instant inspectedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Incident getIncident() { return incident; }
    public void setIncident(Incident incident) { this.incident = incident; }
    public Actor getInspector() { return inspector; }
    public void setInspector(Actor inspector) { this.inspector = inspector; }
    public String getFindings() { return findings; }
    public void setFindings(String findings) { this.findings = findings; }
    public String getSuspectedCause() { return suspectedCause; }
    public void setSuspectedCause(String suspectedCause) { this.suspectedCause = suspectedCause; }
    public Instant getInspectedAt() { return inspectedAt; }
    public void setInspectedAt(Instant inspectedAt) { this.inspectedAt = inspectedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
