package com.jalloop.repository;

import com.jalloop.entity.WaterShortage;
import com.jalloop.enums.Severity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WaterShortageRepository extends JpaRepository<WaterShortage, UUID> {
    List<WaterShortage> findAllByOrderByCreatedAtDesc();
    List<WaterShortage> findBySeverityOrderByCreatedAtDesc(Severity severity);
}
