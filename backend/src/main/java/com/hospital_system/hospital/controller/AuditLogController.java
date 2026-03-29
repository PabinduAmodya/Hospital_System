package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.entity.AuditLog;
import com.hospital_system.hospital.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@CrossOrigin(origins = "*")
public class AuditLogController {

    @Autowired
    private AuditLogService auditLogService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<Page<AuditLog>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditLogService.getAll(page, size));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/user/{username}")
    public ResponseEntity<List<AuditLog>> getByUser(@PathVariable String username) {
        return ResponseEntity.ok(auditLogService.getByUser(username));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/entity/{entityType}")
    public ResponseEntity<List<AuditLog>> getByEntityType(@PathVariable String entityType) {
        return ResponseEntity.ok(auditLogService.getByEntityType(entityType));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/action/{action}")
    public ResponseEntity<List<AuditLog>> getByAction(@PathVariable String action) {
        return ResponseEntity.ok(auditLogService.getByAction(action));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/recent")
    public ResponseEntity<List<AuditLog>> getRecent(@RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(auditLogService.getRecent(limit));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/date-range")
    public ResponseEntity<List<AuditLog>> getByDateRange(
            @RequestParam String start,
            @RequestParam String end) {
        LocalDateTime startDate = LocalDateTime.parse(start);
        LocalDateTime endDate = LocalDateTime.parse(end);
        return ResponseEntity.ok(auditLogService.getByDateRange(startDate, endDate));
    }
}
