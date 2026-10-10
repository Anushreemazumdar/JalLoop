package com.jalloop.repository;

import com.jalloop.entity.RainfallObservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RainfallObservationRepository extends JpaRepository<RainfallObservation, UUID> {
}
