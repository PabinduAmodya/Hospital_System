package com.hospital_system.hospital.dto;

import com.hospital_system.hospital.enums.AppointmentStatus;

public class StatusUpdateDTO {
    private AppointmentStatus status;
    private String notes;

    public StatusUpdateDTO() {}

    public StatusUpdateDTO(AppointmentStatus status, String notes) {
        this.status = status;
        this.notes = notes;
    }

    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}