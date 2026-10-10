package com.jalloop.service;

import com.jalloop.entity.Actor;
import com.jalloop.entity.AuditLog;
import com.jalloop.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {
    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void record(Actor actor, String action, String entityType, String entityId, String detail) {
        AuditLog entry = new AuditLog();
        entry.setActor(actor);
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setDetail(detail);
        auditLogRepository.save(entry);
        log.info("audit action={} entity={} id={} actor={}", action, entityType, entityId,
                actor != null ? actor.getActorKey() : "none");
    }
}
