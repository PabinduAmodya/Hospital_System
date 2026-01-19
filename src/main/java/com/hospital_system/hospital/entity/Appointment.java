package com.hospital_system.hospital.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "schedule_id")
    private Schedule schedule;

    private LocalDate appointmentDate;
    private String status; // Booked, Completed, Cancelled

    public Appointment() {}

    public Appointment(Patient patient, Schedule schedule, LocalDate appointmentDate, String status) {
        this.patient = patient;
        this.schedule = schedule;
        this.appointmentDate = appointmentDate;
        this.status = status;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public Patient getPatient() { return patient; }
    public Schedule getSchedule() { return schedule; }
    public LocalDate getAppointmentDate() { return appointmentDate; }
    public String getStatus() { return status; }

    public void setId(Long id) { this.id = id; }
    public void setPatient(Patient patient) { this.patient = patient; }
    public void setSchedule(Schedule schedule) { this.schedule = schedule; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }
    public void setStatus(String status) { this.status = status; }
}
