package com.jalloop.repository;

import com.jalloop.entity.Assignment;
import com.jalloop.entity.Incident;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {
    List<Assignment> findByIncidentOrderByCreatedAtDesc(Incident incident);
}
