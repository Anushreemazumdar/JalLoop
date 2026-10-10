package com.jalloop.repository;

import com.jalloop.entity.Incident;
import com.jalloop.entity.Inspection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InspectionRepository extends JpaRepository<Inspection, UUID> {
    List<Inspection> findByIncidentOrderByInspectedAtDesc(Incident incident);
}
