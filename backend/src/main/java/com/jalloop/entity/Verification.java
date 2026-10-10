package com.jalloop.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "verifications")
public class Verification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Incident incident;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Actor verifier;

    @Column(nullable = false)
    private boolean outcomeConfirmed;

    @Column(nullable = false, length = 2000)
    private String notes;

    @Column(nullable = false)
    private Instant verifiedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Incident getIncident() { return incident; }
    public void setIncident(Incident incident) { this.incident = incident; }
    public Actor getVerifier() { return verifier; }
    public void setVerifier(Actor verifier) { this.verifier = verifier; }
    public boolean isOutcomeConfirmed() { return outcomeConfirmed; }
    public void setOutcomeConfirmed(boolean outcomeConfirmed) { this.outcomeConfirmed = outcomeConfirmed; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
