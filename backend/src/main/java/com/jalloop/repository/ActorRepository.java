package com.jalloop.repository;

import com.jalloop.entity.Actor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ActorRepository extends JpaRepository<Actor, UUID> {
    Optional<Actor> findByActorKey(String actorKey);
    boolean existsByActorKey(String actorKey);
}
