package com.hospital_system.hospital.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hospital_system.hospital.enums.AppointmentStatus;
import com.hospital_system.hospital.enums.PaymentStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    @Column(nullable = false)
    private LocalDate appointmentDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status = AppointmentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Column(precision = 10, scale = 2)
    private BigDecimal appointmentFee;

    @Column(precision = 10, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal refundAmount = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String cancellationReason;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private LocalDateTime cancelledAt;
    private LocalDateTime paidAt;
    private LocalDateTime refundedAt;

    // Reference to rescheduled appointment - IGNORE BOTH TO PREVENT LOOP
    @OneToOne
    @JoinColumn(name = "rescheduled_from_id")
    @JsonIgnore  // IGNORE THIS COMPLETELY
    private Appointment rescheduledFrom;

    @OneToOne(mappedBy = "rescheduledFrom")
    @JsonIgnore  // IGNORE THIS COMPLETELY
    private Appointment rescheduledTo;

    // Constructors
    public Appointment() {}

    public Appointment(Patient patient, Schedule schedule, LocalDate appointmentDate, BigDecimal appointmentFee) {
        this.patient = patient;
        this.schedule = schedule;
        this.appointmentDate = appointmentDate;
        this.appointmentFee = appointmentFee;
        this.status = AppointmentStatus.PENDING;
        this.paymentStatus = PaymentStatus.UNPAID;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public Schedule getSchedule() { return schedule; }
    public void setSchedule(Schedule schedule) { this.schedule = schedule; }

    public LocalDate getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }

    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
        this.updatedAt = LocalDateTime.now();
    }

    public BigDecimal getAppointmentFee() { return appointmentFee; }
    public void setAppointmentFee(BigDecimal appointmentFee) { this.appointmentFee = appointmentFee; }

    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }

    public BigDecimal getRefundAmount() { return refundAmount; }
    public void setRefundAmount(BigDecimal refundAmount) { this.refundAmount = refundAmount; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }

    public LocalDateTime getRefundedAt() { return refundedAt; }
    public void setRefundedAt(LocalDateTime refundedAt) { this.refundedAt = refundedAt; }

    public Appointment getRescheduledFrom() { return rescheduledFrom; }
    public void setRescheduledFrom(Appointment rescheduledFrom) { this.rescheduledFrom = rescheduledFrom; }

    public Appointment getRescheduledTo() { return rescheduledTo; }
    public void setRescheduledTo(Appointment rescheduledTo) { this.rescheduledTo = rescheduledTo; }
}