package com.jalloop.repository;

import com.jalloop.entity.Incident;
import com.jalloop.entity.IncidentStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface IncidentStatusHistoryRepository extends JpaRepository<IncidentStatusHistory, UUID> {
    List<IncidentStatusHistory> findByIncidentOrderByChangedAtAsc(Incident incident);
}
