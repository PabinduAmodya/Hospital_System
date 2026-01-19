package com.hospital_system.hospital.dto;

import java.time.LocalDate;

public class AppointmentDTO {
    private Long patientId;
    private Long scheduleId;
    private LocalDate appointmentDate;

    public AppointmentDTO() {}

    public Long getPatientId() { return patientId; }
    public Long getScheduleId() { return scheduleId; }
    public LocalDate getAppointmentDate() { return appointmentDate; }

    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public void setScheduleId(Long scheduleId) { this.scheduleId = scheduleId; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }
}
