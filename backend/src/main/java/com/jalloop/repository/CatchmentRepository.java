package com.jalloop.repository;

import com.jalloop.entity.Catchment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CatchmentRepository extends JpaRepository<Catchment, UUID> {
    boolean existsByName(String name);
}
