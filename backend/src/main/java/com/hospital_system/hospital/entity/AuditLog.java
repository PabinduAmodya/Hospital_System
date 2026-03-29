package com.hospital_system.hospital.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action; // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, PAYMENT, REFUND, CANCEL, RESCHEDULE

    @Column(nullable = false)
    private String entityType; // PATIENT, DOCTOR, APPOINTMENT, BILL, USER, etc.

    private Long entityId;

    @Column(columnDefinition = "TEXT")
    private String details; // Human-readable description

    @Column(nullable = false)
    private String performedBy; // username

    private String performedByRole; // ADMIN, RECEPTIONIST, CASHIER

    @Column(nullable = false)
    private LocalDateTime performedAt;

    private String ipAddress;

    @PrePersist
    protected void onCreate() {
        performedAt = LocalDateTime.now();
    }

    // No-arg constructor
    public AuditLog() {
    }

    // All-args constructor (without id and performedAt)
    public AuditLog(String action, String entityType, Long entityId, String details, String performedBy, String performedByRole, String ipAddress) {
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.details = details;
        this.performedBy = performedBy;
        this.performedByRole = performedByRole;
        this.ipAddress = ipAddress;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(String performedBy) {
        this.performedBy = performedBy;
    }

    public String getPerformedByRole() {
        return performedByRole;
    }

    public void setPerformedByRole(String performedByRole) {
        this.performedByRole = performedByRole;
    }

    public LocalDateTime getPerformedAt() {
        return performedAt;
    }

    public void setPerformedAt(LocalDateTime performedAt) {
        this.performedAt = performedAt;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
}
