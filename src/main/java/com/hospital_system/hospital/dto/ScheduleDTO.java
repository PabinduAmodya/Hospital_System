package com.hospital_system.hospital.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ScheduleDTO {

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    @NotBlank(message = "Day is required")
    private String day;

    @NotBlank(message = "Start time is required")
    private String startTime;

    @NotBlank(message = "End time is required")
    private String endTime;

    public ScheduleDTO() {}

    public ScheduleDTO(Long doctorId, String day, String startTime, String endTime) {
        this.doctorId = doctorId;
        this.day = day;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public String getDay() { return day; }
    public void setDay(String day) { this.day = day; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
}
