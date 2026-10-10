package com.jalloop.repository;

import com.jalloop.entity.CitizenReport;
import com.jalloop.entity.Incident;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CitizenReportRepository extends JpaRepository<CitizenReport, UUID> {
    List<CitizenReport> findByIncidentOrderByObservedAtAsc(Incident incident);
}
