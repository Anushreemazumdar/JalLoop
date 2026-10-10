package com.jalloop.repository;

import com.jalloop.entity.RecoveryProject;
import com.jalloop.enums.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RecoveryProjectRepository extends JpaRepository<RecoveryProject, UUID> {
    List<RecoveryProject> findByReviewStatus(ReviewStatus status);
    List<RecoveryProject> findAllByOrderByUpdatedAtDesc();
}
