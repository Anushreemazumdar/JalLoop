package com.jalloop.repository;

import com.jalloop.entity.RecoveryAssessment;
import com.jalloop.enums.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RecoveryAssessmentRepository extends JpaRepository<RecoveryAssessment, UUID> {
    long countByReviewStatus(ReviewStatus reviewStatus);
    List<RecoveryAssessment> findAllByOrderByCreatedAtDesc();
}
