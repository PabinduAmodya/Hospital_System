package com.hospital_system.hospital.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "schedules")
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String day;
    private String startTime;
    private String endTime;

    @ManyToOne
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    public Schedule() {}

    public Schedule(String day, String startTime, String endTime, Doctor doctor) {
        this.day = day;
        this.startTime = startTime;
        this.endTime = endTime;
        this.doctor = doctor;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDay() { return day; }
    public void setDay(String day) { this.day = day; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }
}
