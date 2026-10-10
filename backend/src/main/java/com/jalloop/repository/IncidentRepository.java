package com.jalloop.repository;

import com.jalloop.entity.Incident;
import com.jalloop.enums.IncidentCategory;
import com.jalloop.enums.IncidentStatus;
import com.jalloop.enums.Severity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface IncidentRepository extends JpaRepository<Incident, UUID> {
    long countByStatusNotIn(List<IncidentStatus> statuses);

    long countBySyntheticDemoTrue();

    @Query("""
            SELECT i FROM Incident i
            WHERE (:category IS NULL OR i.category = :category)
              AND (:status IS NULL OR i.status = :status)
              AND (:severity IS NULL OR i.severity = :severity)
            """)
    Page<Incident> search(
            @Param("category") IncidentCategory category,
            @Param("status") IncidentStatus status,
            @Param("severity") Severity severity,
            Pageable pageable);

    List<Incident> findTop8ByOrderByUpdatedAtDesc();
}
