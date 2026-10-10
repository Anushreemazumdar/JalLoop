package com.jalloop.repository;

import com.jalloop.entity.AiAnalysisRun;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AiAnalysisRunRepository extends JpaRepository<AiAnalysisRun, UUID> {
}
