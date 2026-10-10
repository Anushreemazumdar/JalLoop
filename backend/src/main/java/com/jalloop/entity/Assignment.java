package com.jalloop.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assignments")
public class Assignment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Incident incident;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Actor assignee;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Actor assignedBy;

    @Column(nullable = false, length = 400)
    private String note;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Incident getIncident() { return incident; }
    public void setIncident(Incident incident) { this.incident = incident; }
    public Actor getAssignee() { return assignee; }
    public void setAssignee(Actor assignee) { this.assignee = assignee; }
    public Actor getAssignedBy() { return assignedBy; }
    public void setAssignedBy(Actor assignedBy) { this.assignedBy = assignedBy; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
