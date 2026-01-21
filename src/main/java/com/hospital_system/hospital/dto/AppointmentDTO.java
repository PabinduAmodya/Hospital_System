package com.hospital_system.hospital.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class AppointmentDTO {
    private Long patientId;
    private Long scheduleId;
    private LocalDate appointmentDate;
    private BigDecimal appointmentFee;
    private String notes;

    public AppointmentDTO() {}

    // Getters and Setters
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public Long getScheduleId() { return scheduleId; }
    public void setScheduleId(Long scheduleId) { this.scheduleId = scheduleId; }

    public LocalDate getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }

    public BigDecimal getAppointmentFee() { return appointmentFee; }
    public void setAppointmentFee(BigDecimal appointmentFee) { this.appointmentFee = appointmentFee; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}