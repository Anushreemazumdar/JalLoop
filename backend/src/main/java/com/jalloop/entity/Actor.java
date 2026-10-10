package com.jalloop.entity;

import com.jalloop.enums.ActorRole;
import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "actors", indexes = {
        @Index(name = "idx_actor_key", columnList = "actorKey", unique = true)
})
public class Actor {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 64)
    private String actorKey;

    @Column(nullable = false, length = 120)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ActorRole role;

    @Column(nullable = false)
    private boolean syntheticDemo;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getActorKey() { return actorKey; }
    public void setActorKey(String actorKey) { this.actorKey = actorKey; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public ActorRole getRole() { return role; }
    public void setRole(ActorRole role) { this.role = role; }
    public boolean isSyntheticDemo() { return syntheticDemo; }
    public void setSyntheticDemo(boolean syntheticDemo) { this.syntheticDemo = syntheticDemo; }
}
