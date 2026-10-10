package com.jalloop.repository;

import com.jalloop.entity.RecoveryMeasurement;
import com.jalloop.entity.RecoveryProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface RecoveryMeasurementRepository extends JpaRepository<RecoveryMeasurement, UUID> {
    List<RecoveryMeasurement> findByProjectOrderByMeasuredAtDesc(RecoveryProject project);

    @Query("SELECT COALESCE(SUM(m.measuredVolumeM3), 0) FROM RecoveryMeasurement m")
    BigDecimal sumMeasuredVolume();
}
