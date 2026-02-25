package com.hospital_system.hospital.dto;

import com.hospital_system.hospital.entity.Schedule;

public class ScheduleResponse {
    private Long id;
    private String day;
    private String startTime;
    private String endTime;
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;

    public ScheduleResponse() {}

    public static ScheduleResponse from(Schedule s) {
        ScheduleResponse r = new ScheduleResponse();
        r.id = s.getId();
        r.day = s.getDay();
        r.startTime = s.getStartTime();
        r.endTime = s.getEndTime();
        if (s.getDoctor() != null) {
            r.doctorId = s.getDoctor().getId();
            r.doctorName = s.getDoctor().getName();
            r.doctorSpecialization = s.getDoctor().getSpecialization();
        }
        return r;
    }

    public Long getId() { return id; }
    public String getDay() { return day; }
    public String getStartTime() { return startTime; }
    public String getEndTime() { return endTime; }
    public Long getDoctorId() { return doctorId; }
    public String getDoctorName() { return doctorName; }
    public String getDoctorSpecialization() { return doctorSpecialization; }
}