package com.hospital_system.hospital.repository;

import com.hospital_system.hospital.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findAllByOrderByPerformedAtDesc(Pageable pageable);
    List<AuditLog> findByPerformedByOrderByPerformedAtDesc(String username);
    List<AuditLog> findByEntityTypeOrderByPerformedAtDesc(String entityType);
    List<AuditLog> findByActionOrderByPerformedAtDesc(String action);

    @Query("SELECT a FROM AuditLog a WHERE a.performedAt BETWEEN :start AND :end ORDER BY a.performedAt DESC")
    List<AuditLog> findByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT a FROM AuditLog a ORDER BY a.performedAt DESC")
    List<AuditLog> findRecent(Pageable pageable);
}
