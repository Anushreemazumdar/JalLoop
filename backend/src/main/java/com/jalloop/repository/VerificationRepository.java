package com.jalloop.repository;

import com.jalloop.entity.Incident;
import com.jalloop.entity.Verification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VerificationRepository extends JpaRepository<Verification, UUID> {
    List<Verification> findByIncidentOrderByVerifiedAtDesc(Incident incident);
}
