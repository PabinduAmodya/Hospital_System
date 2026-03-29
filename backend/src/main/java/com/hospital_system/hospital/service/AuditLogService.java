package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.AuditLog;
import com.hospital_system.hospital.entity.User;
import com.hospital_system.hospital.repository.AuditLogRepository;
import com.hospital_system.hospital.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Log an audit event with explicit user info.
     */
    public void log(String action, String entityType, Long entityId, String details, String performedBy, String role) {
        AuditLog auditLog = new AuditLog();
        auditLog.setAction(action);
        auditLog.setEntityType(entityType);
        auditLog.setEntityId(entityId);
        auditLog.setDetails(details);
        auditLog.setPerformedBy(performedBy);
        auditLog.setPerformedByRole(role);
        auditLogRepository.save(auditLog);
    }

    /**
     * Log an audit event, auto-detecting current user from SecurityContext.
     */
    public void log(String action, String entityType, Long entityId, String details) {
        String username = "SYSTEM";
        String role = null;

        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null) {
                username = auth.getName();
                Optional<User> userOpt = userRepository.findByUsername(username);
                if (userOpt.isPresent()) {
                    role = userOpt.get().getRole().name();
                }
            }
        } catch (Exception e) {
            // Fallback to SYSTEM if security context is unavailable
        }

        log(action, entityType, entityId, details, username, role);
    }

    public Page<AuditLog> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return auditLogRepository.findAllByOrderByPerformedAtDesc(pageable);
    }

    public List<AuditLog> getByUser(String username) {
        return auditLogRepository.findByPerformedByOrderByPerformedAtDesc(username);
    }

    public List<AuditLog> getByEntityType(String entityType) {
        return auditLogRepository.findByEntityTypeOrderByPerformedAtDesc(entityType);
    }

    public List<AuditLog> getByAction(String action) {
        return auditLogRepository.findByActionOrderByPerformedAtDesc(action);
    }

    public List<AuditLog> getByDateRange(LocalDateTime start, LocalDateTime end) {
        return auditLogRepository.findByDateRange(start, end);
    }

    public List<AuditLog> getRecent(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return auditLogRepository.findRecent(pageable);
    }
}
