package com.hospital_system.hospital.dto;

public class ScheduleDTO {

    private Long doctorId;
    private String day;
    private String startTime;
    private String endTime;

    public ScheduleDTO() {}

    public ScheduleDTO(Long doctorId, String day, String startTime, String endTime) {
        this.doctorId = doctorId;
        this.day = day;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    // Getters & Setters
    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public String getDay() { return day; }
    public void setDay(String day) { this.day = day; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
}
